import { type NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "../../lib/firebase-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Wallet Balance API Route
 * 
 * GET: Retrieve current user's balance from IWSS collection
 * Requires Bearer token authentication
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          error: "Unauthorized - No valid token provided",
          developer: "API developed and maintained by Spotix Technologies"
        }, 
        { status: 401 }
      )
    }

    // Extract and verify ID token
    const idToken = authHeader.split("Bearer ")[1]
    let decodedToken

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json(
        { 
          error: "Invalid or expired token",
          developer: "API developed and maintained by Spotix Technologies"
        }, 
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Fetch balance from IWSS collection
    const iwssDocRef = adminDb.collection("IWSS").doc(userId)
    const iwssDoc = await iwssDocRef.get()

    if (iwssDoc.exists) {
      const iwssData = iwssDoc.data()
      const balance = iwssData?.balance || 0
      const active = iwssData?.active ?? true
      const currency = "NGN"

      return NextResponse.json({
        success: true,
        balance,
        currency,
        active,
        userId,
        error: null,
        developer: "API developed and maintained by Spotix Technologies",
      })
    } else {
      // If IWSS document doesn't exist, create it
      console.log(`Creating IWSS instance for user ${userId}`)
      
      await iwssDocRef.set({
        balance: 0,
        active: true,
        createdAt: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        balance: 0,
        currency: "NGN",
        active: true,
        userId,
        error: null,
        message: "Wallet initialized successfully",
        developer: "API developed and maintained by Spotix Technologies",
      })
    }
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return NextResponse.json(
      { 
        error: "Failed to load wallet balance",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies"
      }, 
      { status: 500 }
    )
  }
}