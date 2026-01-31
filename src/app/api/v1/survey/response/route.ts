import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventId, responses, attendeeInfo } = body

    if (!userId || !eventId) {
      return NextResponse.json({ error: "Missing required fields: userId, eventId" }, { status: 400 })
    }

    if (!responses || typeof responses !== "object") {
      return NextResponse.json({ error: "Responses must be an object" }, { status: 400 })
    }

    // Store response
    const responsesCollectionRef = adminDb
      .collection("events")
      .doc(userId)
      .collection("userEvents")
      .doc(eventId)
      .collection("responses")

    const responseData = {
      responses,
      attendeeInfo: attendeeInfo || {},
      submittedAt: new Date().toISOString(),
      timestamp: new Date(),
    }

    const docRef = await responsesCollectionRef.add(responseData)

    return NextResponse.json({
      success: true,
      message: "Response saved successfully",
      responseId: docRef.id,
    })
  } catch (error) {
    console.error("Error saving response:", error)
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const eventId = searchParams.get("eventId")

    if (!userId || !eventId) {
      return NextResponse.json({ error: "Missing required parameters: userId, eventId" }, { status: 400 })
    }

    // Get all responses
    const responsesCollectionRef = adminDb
      .collection("events")
      .doc(userId)
      .collection("userEvents")
      .doc(eventId)
      .collection("responses")

    const responsesSnapshot = await responsesCollectionRef.orderBy("timestamp", "desc").get()
    const responses = responsesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get questions for reference
    const questionsCollectionRef = adminDb
      .collection("events")
      .doc(userId)
      .collection("userEvents")
      .doc(eventId)
      .collection("questions")

    const questionsSnapshot = await questionsCollectionRef.orderBy("order").get()
    const questions = questionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      success: true,
      responses,
      questions,
      totalResponses: responses.length,
    })
  } catch (error) {
    console.error("Error fetching responses:", error)
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 })
  }
}