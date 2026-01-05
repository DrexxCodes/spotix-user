import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 * GET: Retrieve IWSS account status
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
          active: iwssData?.active ?? true,
          reason: iwssData?.reason || null,
          balance: iwssData?.balance || 0,
          deactivatedAt: iwssData?.deactivatedAt || null,
          reactivatedAt: iwssData?.reactivatedAt || null,
          lastUpdated: iwssData?.lastUpdated || null,
        },
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching IWSS status:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch account status",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Toggle IWSS account status (active/inactive)
 */
export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { active, reason } = body;

    // Validate required fields
    if (typeof active !== "boolean") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Active status (boolean) is required",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // If deactivating, reason is required
    if (!active && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Reason is required when deactivating account",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Validate reason length
    if (reason && reason.length > 500) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Reason must be less than 500 characters",
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
    const currentStatus = iwssData?.active ?? true;

    // Check if status is already the same
    if (currentStatus === active) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: `Account is already ${active ? "active" : "inactive"}`,
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      active,
      lastUpdated: FieldValue.serverTimestamp(),
    };

    if (!active) {
      // Deactivating account
      updateData.reason = reason.trim();
      updateData.deactivatedAt = FieldValue.serverTimestamp();
    } else {
      // Reactivating account - clear reason and deactivation timestamp
      updateData.reason = FieldValue.delete();
      updateData.reactivatedAt = FieldValue.serverTimestamp();
    }

    // Update IWSS document
    await iwssDocRef.update(updateData);

    return NextResponse.json(
      {
        success: true,
        message: `Account ${active ? "activated" : "deactivated"} successfully`,
        data: {
          active,
          reason: active ? null : reason.trim(),
        },
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating IWSS status:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to update account status",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}