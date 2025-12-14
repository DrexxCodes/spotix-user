import { type NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "../../lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No valid token provided" }, { status: 401 })
    }

    const idToken = authHeader.split("Bearer ")[1]

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const userId = decodedToken.uid

    const userDocRef = adminDb.collection("users").doc(userId)
    const userDoc = await userDocRef.get()

    if (userDoc.exists) {
      const userData = userDoc.data()
      const balance = userData?.wallet || 0
      const currency = userData?.currency || "NGN"

      return NextResponse.json({
        balance,
        currency,
        error: null,
      })
    } else {
      await userDocRef.set({
        wallet: 0,
        currency: "NGN",
        createdAt: new Date().toISOString(),
      })

      return NextResponse.json({
        balance: 0,
        currency: "NGN",
        error: null,
      })
    }
  } catch (error) {
    console.error("Error fetching wallet:", error)
    return NextResponse.json({ error: "Failed to load wallet balance" }, { status: 500 })
  }
}
