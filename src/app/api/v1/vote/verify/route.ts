import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, status, transactionReference, paymentReference, message } = body

    if (!reference || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the payment reference document
    const refDoc = await adminDb.collection("Reference").doc(reference).get()

    if (!refDoc.exists) {
      return NextResponse.json({ error: "Payment reference not found" }, { status: 404 })
    }

    const refData = refDoc.data()

    // Update payment status
    const updateData: any = {
      status: status,
      updatedAt: new Date().toISOString(),
    }

    if (status === "success") {
      updateData.transactionReference = transactionReference
      updateData.paymentReference = paymentReference
      updateData.paymentCompletedAt = new Date().toISOString()

      // Increment contestant votes
      if (refData) {
        const { creatorId, voteId, contestantId, voteCount } = refData

        try {
          // Get the vote document
          const voteDocRef = adminDb.collection("voting").doc(creatorId).collection("votes").doc(voteId)
          const voteDoc = await voteDocRef.get()

          if (voteDoc.exists) {
            const voteData = voteDoc.data()
            const contestants = voteData?.contestants || []

            // Find and update the specific contestant
            const updatedContestants = contestants.map((contestant: any) => {
              if (contestant.contestantId === contestantId) {
                return {
                  ...contestant,
                  votes: (contestant.votes || 0) + voteCount,
                }
              }
              return contestant
            })

            // Update the vote document with new contestant votes and increment poll count
            await voteDocRef.update({
              contestants: updatedContestants,
              pollCount: FieldValue.increment(voteCount),
              pollAmount: FieldValue.increment(refData.totalAmount),
            })

            // Add vote entry to pollEntries
            const voteEntry = {
              uid: refData.userId || refData.guestEmail,
              voteCount: voteCount,
              price: refData.pollPrice,
              contestantId: contestantId,
              contestantName: refData.contestantName,
              date: new Date().toISOString(),
              reference: reference,
              isGuest: refData.isGuest || false,
            }

            await voteDocRef.update({
              pollEntries: FieldValue.arrayUnion(voteEntry),
            })

            console.log(`Successfully incremented votes for contestant ${contestantId}`)
          }
        } catch (error) {
          console.error("Error updating contestant votes:", error)
          // Continue with payment reference update even if vote increment fails
        }
      }
    } else if (status === "failed") {
      updateData.failureMessage = message || "Payment failed"
      updateData.paymentFailedAt = new Date().toISOString()
    }

    // Update the reference document
    await adminDb.collection("Reference").doc(reference).update(updateData)

    return NextResponse.json(
      {
        success: true,
        message: `Payment ${status} recorded successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}