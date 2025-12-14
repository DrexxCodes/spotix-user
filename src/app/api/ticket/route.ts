import { type NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/app/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

interface TicketRequest {
  eventId: string
  eventCreatorId: string
  userId: string
  paymentReference: string
  paymentMethod: string
  ticketPrice: number
  originalPrice?: number
  transactionFee?: number
  totalAmount?: number
  currency?: string
  ticketType: string
  discountCode?: string
  discountApplied?: boolean
  eventName: string
  eventVenue?: string
  eventType?: string
  eventDate?: string
  eventEndDate?: string
  eventStart?: string
  eventEnd?: string
  stopDate?: string
  enableStopDate?: boolean
  bookerName?: string
  bookerEmail?: string
}

function generateTicketId(): string {
  const randomNumbers = Math.floor(10000000 + Math.random() * 90000000).toString()
  const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase()

  const pos1 = Math.floor(Math.random() * 8)
  const pos2 = Math.floor(Math.random() * 7) + pos1 + 1

  const part1 = randomNumbers.substring(0, pos1)
  const part2 = randomNumbers.substring(pos1, pos2)
  const part3 = randomNumbers.substring(pos2)

  return `SPTX-TX-${part1}${randomLetters[0]}${part2}${randomLetters[1]}${part3}`
}

export async function POST(request: NextRequest) {
  try {
    const body: TicketRequest = await request.json()
    const {
      eventId,
      eventCreatorId,
      userId,
      paymentReference,
      paymentMethod,
      ticketPrice,
      originalPrice,
      transactionFee = 0,
      totalAmount,
      currency = "NGN",
      ticketType,
      discountCode,
      discountApplied = false,
      eventName,
      eventVenue,
      eventType,
      eventDate,
      eventEndDate,
      eventStart,
      eventEnd,
      stopDate,
      enableStopDate,
      bookerName,
      bookerEmail,
    } = body

    // Validate required fields
    if (!eventId || !eventCreatorId || !userId || !paymentReference || !ticketPrice || !eventName || !ticketType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: "Token mismatch" }, { status: 403 })
    }

    const ticketId = generateTicketId()
    const ticketReference = paymentReference
    const now = new Date()
    const purchaseDate = now.toLocaleDateString()
    const purchaseTime = now.toLocaleTimeString()

    // Get user data
    const userRef = adminDb.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()!

    const ticketData = {
      uid: userId,
      fullName: userData.fullName || "",
      email: userData.email || "",
      ticketType,
      ticketId,
      ticketReference,
      purchaseDate,
      purchaseTime,
      verified: false,
      paymentMethod,
      originalPrice: originalPrice || ticketPrice,
      ticketPrice,
      transactionFee,
      totalAmount: totalAmount || ticketPrice,
      discountApplied,
      discountCode: discountCode || null,
      eventVenue: eventVenue || null,
      eventType: eventType || null,
      eventDate: eventDate || null,
      eventEndDate: eventEndDate || null,
      eventStart: eventStart || null,
      eventEnd: eventEnd || null,
      ...(stopDate ? { stopDate } : {}),
    }

    // Start batch operations
    const batch = adminDb.batch()

    const attendeesCollectionRef = adminDb
      .collection("events")
      .doc(eventCreatorId)
      .collection("userEvents")
      .doc(eventId)
      .collection("attendees")

    const attendeeDocRef = attendeesCollectionRef.doc()
    batch.set(attendeeDocRef, ticketData)

    const ticketHistoryRef = adminDb
      .collection("TicketHistory")
      .doc(userId)
      .collection("tickets")
      .doc(attendeeDocRef.id)

    batch.set(ticketHistoryRef, {
      ...ticketData,
      eventId,
      eventName,
      eventCreatorId,
    })

    const eventDocRef = adminDb.collection("events").doc(eventCreatorId).collection("userEvents").doc(eventId)

    const eventDoc = await eventDocRef.get()

    if (eventDoc.exists) {
      const eventDataFromDb = eventDoc.data()!

      // Update event statistics
      batch.update(eventDocRef, {
        ticketsSold: (eventDataFromDb.ticketsSold || 0) + 1,
        totalRevenue: (eventDataFromDb.totalRevenue || 0) + Number(ticketPrice),
      })

      const pricing = eventDataFromDb.pricing || []
      const updatedPricing = pricing.map((ticket: any) => {
        if (ticket.ticketType === ticketType && ticket.availableTickets > 0) {
          return { ...ticket, availableTickets: ticket.availableTickets - 1 }
        }
        return ticket
      })

      batch.update(eventDocRef, {
        pricing: updatedPricing,
      })
    }

    if (discountApplied && discountCode) {
      const discountsCollectionRef = adminDb
        .collection("events")
        .doc(eventCreatorId)
        .collection("userEvents")
        .doc(eventId)
        .collection("discounts")

      const discountsSnapshot = await discountsCollectionRef.get()

      discountsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.code === discountCode) {
          batch.update(doc.ref, {
            usedCount: (data.usedCount || 0) + 1,
          })
        }
      })
    }

    if (paymentMethod === "wallet") {
      const walletRef = adminDb.collection("wallets").doc(userId)
      batch.update(walletRef, {
        balance: FieldValue.increment(-(totalAmount || ticketPrice)),
        updatedAt: FieldValue.serverTimestamp(),
      })

      // Add transaction record
      const transactionRef = adminDb.collection("transactions").doc()
      batch.set(transactionRef, {
        userId,
        type: "debit",
        amount: totalAmount || ticketPrice,
        currency,
        description: `Ticket purchase for ${eventName}`,
        reference: paymentReference,
        status: "completed",
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    const referenceDocRef = adminDb
      .collection("references")
      .doc(userId)
      .collection("userReferences")
      .doc(paymentReference)

    const referenceDoc = await referenceDocRef.get()
    if (referenceDoc.exists) {
      batch.update(referenceDocRef, {
        settled: true,
        settledAt: purchaseDate,
        settledTime: purchaseTime,
        ticketId: ticketId,
      })
    }

    // Commit the batch
    await batch.commit()

    return NextResponse.json({
      success: true,
      message: "Ticket generated successfully",
      ticketId,
      ticketReference,
      userData: {
        fullName: userData.fullName || "",
        email: userData.email || "",
      },
      finalPrice: ticketPrice,
      discountApplied,
      eventDetails: {
        eventVenue: eventVenue || "",
        eventType: eventType || "",
        eventDate: eventDate || "",
        eventEndDate: eventEndDate || "",
        eventStart: eventStart || "",
        eventEnd: eventEnd || "",
        stopDate,
        enableStopDate,
        bookerName,
        bookerEmail,
      },
    })
  } catch (error) {
    console.error("Error generating ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET method to retrieve ticket details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")
    const userId = searchParams.get("userId")

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Verify user authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    // Get ticket data
    const ticketRef = adminDb.collection("tickets").doc(ticketId)
    const ticketDoc = await ticketRef.get()

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticketData = ticketDoc.data()!

    // Check if user owns this ticket or is the event creator
    if (ticketData.userId !== decodedToken.uid && ticketData.creatorId !== decodedToken.uid) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      ticket: ticketData,
    })
  } catch (error) {
    console.error("Error retrieving ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
