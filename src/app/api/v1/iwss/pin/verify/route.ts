import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting map (userId -> { attempts: number, lastAttempt: timestamp })
const rateLimitMap = new Map<string, { attempts: number, lastAttempt: number, lockedUntil?: number }>();

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

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

  if (userLimit.lockedUntil && now < userLimit.lockedUntil) {
    const minutesLeft = Math.ceil((userLimit.lockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${minutesLeft} minute(s)`,
      lockedUntil: new Date(userLimit.lockedUntil),
    };
  }

  if (now - userLimit.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { attempts: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (userLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const lockedUntil = now + LOCK_DURATION;
    rateLimitMap.set(userId, { ...userLimit, lockedUntil });
    return {
      allowed: false,
      message: "Too many attempts. Your account has been temporarily locked for 30 minutes",
      lockedUntil: new Date(lockedUntil),
    };
  }

  rateLimitMap.set(userId, {
    attempts: userLimit.attempts + 1,
    lastAttempt: now,
    lockedUntil: userLimit.lockedUntil,
  });

  return { allowed: true };
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
 * POST: Verify PIN without changing it
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
    const { pin } = body;

    // Validate PIN
    if (!pin) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "PIN is required",
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

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, iwssData.iwssPin);
    
    if (!isPinValid) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Current PIN is incorrect",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 401 }
      );
    }

    // PIN is valid
    return NextResponse.json(
      {
        success: true,
        message: "PIN verified successfully",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to verify PIN",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}