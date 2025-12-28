import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"
import { auth } from "firebase-admin"

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
      ticketPrice,
      ticketType,
      totalAmount,
      discountCode,
      discountData,
      referralCode,
      referralData,
      eventName,
      eventVenue,
      eventDate,
      eventEndDate,
      eventStart,
      eventEnd,
    } = body

    // Validate required fields
    if (!eventId || !eventCreatorId || ticketPrice === undefined || !ticketType || totalAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate unique reference
    const timestamp = Date.now()
    const reference = `SPTX-REF-${timestamp}`

    // Prepare metadata for Firestore
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
      ticketPrice: Number(ticketPrice),
      ticketType,
      totalAmount: Number(totalAmount),
      vendor: "paystack",
      status: "pending",
      paymentCreationDate: new Date().toISOString(),
      paymentCreationTimestamp: timestamp,
      
      // Optional fields
      discountCode: discountCode || null,
      discountData: discountData || null,
      referralCode: referralCode || null,
      referralName: referralData?.code || referralCode || null,
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store in Firestore Reference collection
    const referenceDocRef = adminDb.collection("Reference").doc(reference)
    await referenceDocRef.set(paymentReference)

    console.log(`Payment reference created: ${reference}`)

    return NextResponse.json(
      {
        success: true,
        reference,
        message: "Payment reference created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating payment reference:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}