import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"
import { auth } from "firebase-admin"

/**
 * Free Ticket Reference Creation Route
 * Creates payment reference for free events with status "settled"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const idToken = authHeader.split("Bearer ")[1]
    let decodedToken
    
    try {
      decodedToken = await auth().verifyIdToken(idToken)
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const {
      eventId,
      eventCreatorId,
      ticketType,
      referralCode,
      referralData,
      eventName,
      eventVenue,
      eventDate,
      eventEndDate,
      eventStart,
      eventEnd,
      bookerName,
      bookerEmail,
      userFullName,
      userEmail,
    } = body

    // Validate required fields
    if (!eventId || !eventCreatorId || !ticketType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate unique reference for free ticket
    const timestamp = Date.now()
    const reference = `SPTX-REF-${timestamp}`

    // Prepare metadata for Firestore
    // For free events: ticketPrice = 0, totalAmount = 0, transactionFee = 0
    // Status is immediately "settled" since no payment is required
    const paymentReference = {
      reference,
      userId,
      eventId,
      eventCreatorId,
      eventName: eventName || "",
      eventVenue: eventVenue || "",
      eventDate: eventDate || "",
      eventEndDate: eventEndDate || "",
      eventStart: eventStart || "",
      eventEnd: eventEnd || "",
      bookerName: bookerName || "Event Host",
      bookerEmail: bookerEmail || "support@spotix.com.ng",
      userFullName: userFullName || "Valued Customer",
      userEmail: userEmail || "",
      
      // Free ticket pricing
      ticketPrice: 0,
      ticketType,
      totalAmount: 0,
      transactionFee: 0,
      
      // Free ticket specific fields
      vendor: "free ticket",
      status: "settled", // Immediately settled since it's free
      paymentMethod: "Free Ticket",
      
      // Payment timestamps
      paymentCreationDate: new Date().toISOString(),
      paymentCreationTimestamp: timestamp,
      paymentCompletedAt: new Date().toISOString(), // Completed immediately
      
      // Optional fields (no discount for free events)
      discountCode: null,
      discountData: null,
      referralCode: referralCode || null,
      referralName: referralData?.code || referralCode || null,
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store in Firestore Reference collection
    const referenceDocRef = adminDb.collection("Reference").doc(reference)
    await referenceDocRef.set(paymentReference)

    console.log(`Free ticket reference created: ${reference}`)

    return NextResponse.json(
      {
        success: true,
        reference,
        message: "Free ticket reference created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating free ticket reference:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}