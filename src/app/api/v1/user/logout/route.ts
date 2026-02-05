import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Logout API Route
 * 
 * POST /api/logout - Clear session cookies and revoke Firebase tokens
 * 
 */

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    // If there's a session cookie, revoke all refresh tokens for the user
    if (sessionCookie) {
      try {
        // Verify the session cookie to get the user's UID
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
        const uid = decodedClaims.uid;

        // Revoke all refresh tokens for this user
        // This ensures the user is logged out on all devices/sessions
        await adminAuth.revokeRefreshTokens(uid);
        
        console.log(`✅ Revoked refresh tokens for user: ${uid}`);
      } catch (verifyError) {
        // Session cookie might be expired or invalid, but we still want to clear it
        console.log("⚠️ Could not verify session cookie, but proceeding with logout");
      }
    }

    // Clear the session cookie
    cookieStore.set("session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Clear any other auth-related cookies (if they exist)
    // For example, if you were storing isBooker in booker portal
    cookieStore.set("isBooker", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    console.log("✅ Session cookies cleared successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Logout error:", error);

    // Even if there's an error, we should still try to clear cookies
    const cookieStore = await cookies();
    cookieStore.set("session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json(
      {
        success: true, // Still return success because cookies are cleared
        message: "Logged out (with errors during token revocation)",
        details: error.message,
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message: "Please use POST method to logout",
      developer: "API developed and maintained by Spotix Technologies",
    },
    { status: 405 }
  );
}