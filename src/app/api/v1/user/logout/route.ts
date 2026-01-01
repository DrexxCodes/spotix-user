import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Logout API Route
 * 
 * POST: Handle user logout and session cookie clearing
 */

/**
 * POST Handler
 * Clears the session cookie and optionally revokes refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    // If no session cookie exists, return success anyway
    if (!sessionCookie) {
      const response = NextResponse.json(
        {
          success: true,
          message: "Logged out successfully",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 200 }
      );

      // Clear the session cookie
      response.cookies.delete("session");
      return response;
    }

    try {
      // Verify the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      
      // Optionally revoke all refresh tokens for this user
      // This forces the user to re-authenticate on all devices
      await adminAuth.revokeRefreshTokens(decodedClaims.uid);
      
      console.log(`Revoked refresh tokens for user: ${decodedClaims.uid}`);
    } catch (error) {
      console.log("Error verifying/revoking session:", error);
      // Continue with logout even if verification fails
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );

    // Clear the session cookie
    response.cookies.set({
      name: "session",
      value: "",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if there's an error, clear the cookie and return success
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );

    response.cookies.delete("session");
    return response;
  }
}