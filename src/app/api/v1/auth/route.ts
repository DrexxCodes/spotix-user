import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auth API Route for User Portal
 * 
 * POST /api/auth - Create session with ID token
 * GET /api/auth - Check session status
 */

/**
 * POST Handler - Login and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ID token is required",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Fetch user document from Firestore
    let userData = null;
    let balance = 0;

    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        return NextResponse.json(
          {
            error: "Not Found",
            message: "User profile not found",
            developer: "API developed and maintained by Spotix Technologies",
          },
          { status: 404 }
        );
      }

      userData = userDoc.data();

      // Fetch balance from IWSS collection
      try {
        const iwssDoc = await adminDb.collection("IWSS").doc(uid).get();
        if (iwssDoc.exists) {
          const iwssData = iwssDoc.data();
          balance = iwssData?.balance || 0;
        }
      } catch (iwssError) {
        console.error("Error fetching IWSS balance:", iwssError);
      }

      // Update last login timestamp
      try {
        await adminDb.collection("users").doc(uid).update({
          lastLogin: new Date().toISOString(),
        });
      } catch (updateError) {
        console.error("Error updating last login:", updateError);
      }
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "Unable to retrieve user data",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 500 }
      );
    }

    // Create session cookie (expires in 14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Session created successfully",
        user: {
          uid: uid,
          email: email,
          username: userData?.username || "",
          fullName: userData?.fullName || "",
          isBooker: userData?.isBooker || false,
          balance: balance,
          createdAt: userData?.createdAt || "",
          lastLogin: new Date().toISOString(),
        },
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Session creation error:", error);

    let errorMessage = "Unable to create session. Please try again";
    if (error.code === "auth/invalid-id-token") {
      errorMessage = "Invalid authentication token";
    } else if (error.code === "auth/id-token-expired") {
      errorMessage = "Authentication token has expired. Please login again";
    }

    return NextResponse.json(
      {
        error: "Session Creation Failed",
        message: errorMessage,
        details: error.message,
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 401 }
    );
  }
}

/**
 * GET Handler - Check session status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "No active session",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 200 }
      );
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json(
      {
        authenticated: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Session verification error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        message: "Invalid or expired session",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  }
}