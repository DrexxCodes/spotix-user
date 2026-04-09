import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/lib/firebase"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { verifyAccessToken, type TokenAudience } from "@/app/lib/auth-tokens"

const AUDIENCE: TokenAudience = "spotix-user"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params

    // Extract token from Authorization header or cookie
    let token = ""
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get("spotix_u_at")?.value || ""
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify authentication
    let tokenData
    try {
      tokenData = await verifyAccessToken(token, AUDIENCE)
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      )
    }

    if (!tokenData || !tokenData.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const userEmail = tokenData.email

    // Get request body
    const body = await request.json()
    const { embedding, eventId } = body

    // Validate input
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { success: false, message: "Invalid embedding data. Must be an array of 128 numbers." },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      )
    }

    // Verify ticket exists and belongs to the user
    const ticketRef = doc(db, "tickets", ticketId)
    const ticketDoc = await getDoc(ticketRef)

    if (!ticketDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      )
    }

    const ticketData = ticketDoc.data()
    if (ticketData.email !== userEmail) {
      return NextResponse.json(
        { success: false, message: "You do not have permission to add embedding for this ticket" },
        { status: 403 }
      )
    }

    // Verify event exists
    const eventRef = doc(db, "events", eventId)
    const eventDoc = await getDoc(eventRef)

    if (!eventDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      )
    }

    // Save embedding to events/{eventId}/attendees/{ticketId}
    const attendeeRef = doc(db, "events", eventId, "attendees", ticketId)
    
    await setDoc(
      attendeeRef,
      {
        faceEmbedding: embedding,
        email: userEmail,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    // Also save embedding reference in the ticket document
    await setDoc(
      ticketRef,
      {
        faceEmbedding: embedding,
        faceEmbeddingUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Face embedding saved successfully",
        data: {
          ticketId,
          eventId,
          embeddingPoints: embedding.length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Error saving face embedding:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
