import { NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/app/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      voteId,
      creatorId,
      contestantId,
      contestantName,
      pollPrice,
      voteCount,
      totalAmount,
      pollName,
      userId,
      guestName,
      guestEmail,
    } = body

    // Validate required fields
    if (
      !voteId ||
      !creatorId ||
      !contestantId ||
      !contestantName ||
      pollPrice === undefined ||
      voteCount === undefined ||
      totalAmount === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If userId is provided, verify authentication
    let verifiedUserId = null
    if (userId) {
      const authHeader = request.headers.get("Authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1]
        try {
          const decodedToken = await adminAuth.verifyIdToken(idToken)
          verifiedUserId = decodedToken.uid
        } catch (error) {
          console.log("Token verification failed:", error)
          // Continue as guest if token verification fails
        }
      }
    }

    // Validate guest details if not logged in
    if (!verifiedUserId && (!guestName || !guestEmail)) {
      return NextResponse.json({ error: "Guest name and email are required for non-authenticated users" }, { status: 400 })
    }

    // Generate unique reference
    const timestamp = Date.now()
    const reference = `SPTX-REF-${timestamp}`

    // Prepare metadata for Firestore
    const paymentReference = {
      reference,
      voteId,
      creatorId,
      contestantId,
      contestantName,
      pollName: pollName || "",
      pollPrice: Number(pollPrice),
      voteCount: Number(voteCount),
      totalAmount: Number(totalAmount),
      vendor: "monnify",
      status: "pending",
      paymentCreationDate: new Date().toISOString(),
      paymentCreationTimestamp: timestamp,

      // User or guest info
      userId: verifiedUserId || null,
      isGuest: !verifiedUserId,
      guestName: verifiedUserId ? null : guestName,
      guestEmail: verifiedUserId ? null : guestEmail,

      // Metadata for Monnify
      metadata: {
        voteId,
        contestantId,
        contestantName,
        pollName,
        voteCount,
        userType: verifiedUserId ? "registered" : "guest",
      },

      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store in Firestore Reference collection
    const referenceDocRef = adminDb.collection("Reference").doc(reference)
    await referenceDocRef.set(paymentReference)

    console.log(`Vote payment reference created: ${reference}`)

    return NextResponse.json(
      {
        success: true,
        reference,
        message: "Payment reference created successfully",
        metadata: paymentReference.metadata,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating vote payment reference:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}