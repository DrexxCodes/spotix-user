// app/api/v1/user/[uid]/bot/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/lib/firebase"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { randomBytes } from "crypto"

/**
 * Generate Telegram connection token
 * The token is stored temporarily and used to link a Telegram account
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ uid: string }> }
) {
  try {
    const params = await props.params
    const { uid } = params

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === "generate") {
      // Generate a unique connection token (32 character hex string)
      const connectionToken = randomBytes(16).toString("hex")

      // Store the token in a temporary collection with expiration
      const tokenDocRef = doc(db, "telegram_tokens", connectionToken)
      await setDoc(tokenDocRef, {
        userId: uid,
        token: connectionToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes expiry
        used: false,
      })

      return NextResponse.json({
        success: true,
        token: connectionToken,
      })
    } else if (action === "disconnect") {
      // Disconnect Telegram account
      const userDocRef = doc(db, "users", uid)
      await updateDoc(userDocRef, {
        telegramConnected: false,
        telegramUsername: null,
        telegramChatId: null,
      })

      return NextResponse.json({
        success: true,
        message: "Telegram account disconnected successfully",
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error handling Telegram bot request:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * Get Telegram connection status
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ uid: string }> }
) {
  try {
    const params = await props.params
    const { uid } = params

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's Telegram connection status
    const userDocRef = doc(db, "users", uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    return NextResponse.json({
      success: true,
      telegramConnected: userData.telegramConnected || false,
      telegramUsername: userData.telegramUsername || null,
      telegramChatId: userData.telegramChatId || null,
    })
  } catch (error) {
    console.error("Error fetching Telegram status:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}