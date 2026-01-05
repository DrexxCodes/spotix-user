import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting map (userId -> { attempts: number, lastAttempt: timestamp })
const rateLimitMap = new Map<string, { attempts: number, lastAttempt: number, lockedUntil?: number }>();

const RATE_LIMIT_MAX_ATTEMPTS = 5; // Max attempts per window
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes lockout after max attempts

/**
 * Check and enforce rate limiting
 */
function checkRateLimit(userId: string): { allowed: boolean; message?: string; lockedUntil?: Date } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit) {
    rateLimitMap.set(userId, { attempts: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Check if user is locked out
  if (userLimit.lockedUntil && now < userLimit.lockedUntil) {
    const minutesLeft = Math.ceil((userLimit.lockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${minutesLeft} minute(s)`,
      lockedUntil: new Date(userLimit.lockedUntil),
    };
  }

  // Reset if window expired
  if (now - userLimit.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { attempts: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Check if exceeded attempts
  if (userLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const lockedUntil = now + LOCK_DURATION;
    rateLimitMap.set(userId, { ...userLimit, lockedUntil });
    return {
      allowed: false,
      message: "Too many attempts. Your account has been temporarily locked for 30 minutes",
      lockedUntil: new Date(lockedUntil),
    };
  }

  // Increment attempts
  rateLimitMap.set(userId, {
    attempts: userLimit.attempts + 1,
    lastAttempt: now,
    lockedUntil: userLimit.lockedUntil,
  });

  return { allowed: true };
}

/**
 * Reset rate limit for user (call after successful operation)
 */
function resetRateLimit(userId: string) {
  rateLimitMap.delete(userId);
}

/**
 * Verify Firebase Auth token from request headers
 */
async function verifyAuthToken(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return {
      userId: decodedToken.uid,
      email: decodedToken.email || "",
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * GET: Check if user has set PIN and return IWSS status
 */
export async function GET(request: NextRequest) {
  try {
    const authData = await verifyAuthToken(request);
    if (!authData) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 401 }
      );
    }

    const { userId } = authData;

    // Fetch IWSS document
    const iwssDoc = await adminDb.collection("IWSS").doc(userId).get();

    if (!iwssDoc.exists) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "IWSS account not found",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 404 }
      );
    }

    const iwssData = iwssDoc.data();

    return NextResponse.json(
      {
        success: true,
        data: {
          hasPinSet: !!iwssData?.iwssPin,
          active: iwssData?.active ?? true,
          reason: iwssData?.reason || null,
          balance: iwssData?.balance || 0,
        },
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking IWSS PIN status:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to check PIN status",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Set new PIN (first time setup)
 */
export async function POST(request: NextRequest) {
  try {
    const authData = await verifyAuthToken(request);
    if (!authData) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 401 }
      );
    }

    const { userId } = authData;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate Limit Exceeded",
          message: rateLimitCheck.message,
          lockedUntil: rateLimitCheck.lockedUntil,
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pin, confirmPin } = body;

    // Validate PIN
    if (!pin || !confirmPin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "PIN and confirmation PIN are required",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "PIN must be exactly 4 digits",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Check if PINs match
    if (pin !== confirmPin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "PINs do not match",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Check if IWSS document exists
    const iwssDocRef = adminDb.collection("IWSS").doc(userId);
    const iwssDoc = await iwssDocRef.get();

    if (!iwssDoc.exists) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "IWSS account not found. Please contact support",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 404 }
      );
    }

    const iwssData = iwssDoc.data();

    // Check if PIN already exists
    if (iwssData?.iwssPin) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "PIN already set. Use the change PIN option to update it",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 409 }
      );
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update IWSS document with hashed PIN
    await iwssDocRef.update({
      iwssPin: hashedPin,
      pinSetAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // Reset rate limit on success
    resetRateLimit(userId);

    return NextResponse.json(
      {
        success: true,
        message: "PIN set successfully",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error setting IWSS PIN:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to set PIN",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Change existing PIN
 */
export async function PUT(request: NextRequest) {
  try {
    const authData = await verifyAuthToken(request);
    if (!authData) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 401 }
      );
    }

    const { userId } = authData;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate Limit Exceeded",
          message: rateLimitCheck.message,
          lockedUntil: rateLimitCheck.lockedUntil,
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { currentPin, newPin, confirmNewPin } = body;

    // Validate required fields
    if (!currentPin || !newPin || !confirmNewPin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Current PIN, new PIN, and confirmation are required",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Validate new PIN format (4 digits)
    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "New PIN must be exactly 4 digits",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Check if new PINs match
    if (newPin !== confirmNewPin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "New PINs do not match",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Check if new PIN is same as current PIN
    if (currentPin === newPin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "New PIN must be different from current PIN",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Fetch IWSS document
    const iwssDocRef = adminDb.collection("IWSS").doc(userId);
    const iwssDoc = await iwssDocRef.get();

    if (!iwssDoc.exists) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "IWSS account not found",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 404 }
      );
    }

    const iwssData = iwssDoc.data();

    // Check if PIN exists
    if (!iwssData?.iwssPin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "No PIN set. Please set a PIN first",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Verify current PIN
    const isCurrentPinValid = await bcrypt.compare(currentPin, iwssData.iwssPin);
    if (!isCurrentPinValid) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Current PIN is incorrect",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 401 }
      );
    }

    // Hash the new PIN
    const hashedNewPin = await bcrypt.hash(newPin, 10);

    // Update IWSS document with new hashed PIN
    await iwssDocRef.update({
      iwssPin: hashedNewPin,
      pinChangedAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // Reset rate limit on success
    resetRateLimit(userId);

    return NextResponse.json(
      {
        success: true,
        message: "PIN changed successfully",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error changing IWSS PIN:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to change PIN",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}