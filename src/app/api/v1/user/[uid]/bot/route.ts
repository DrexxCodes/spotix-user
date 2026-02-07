import { NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/app/lib/firebase-admin"
import { randomBytes } from "crypto"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { uid } = params

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token)
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "generate") {
      // Generate connection token
      const connectionToken = randomBytes(16).toString("hex")

      if (!BACKEND_URL) {
        return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 })
      }

      // Call backend to store the token
      const backendResponse = await fetch(`${BACKEND_URL}/v1/telegram/generate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: uid,
          token: connectionToken,
        }),
      })

      if (!backendResponse.ok) {
        throw new Error("Failed to generate token")
      }

      return NextResponse.json({
        success: true,
        token: connectionToken,
      })
    } else if (action === "disconnect") {
      // Disconnect Telegram account
      await adminDb.collection("users").doc(uid).update({
        telegramConnected: false,
        telegramUsername: "",
        telegramChatId: "",
      })

      return NextResponse.json({
        success: true,
        message: "Telegram account disconnected",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error handling Telegram bot request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { uid } = params

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token)
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get user's Telegram connection status
    const userDoc = await adminDb.collection("users").doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()

    return NextResponse.json({
      success: true,
      telegramConnected: userData?.telegramConnected || false,
      telegramUsername: userData?.telegramUsername || null,
    })
  } catch (error) {
    console.error("Error fetching Telegram status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}