import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const creatorId = searchParams.get("creatorId")
    const currentEventId = searchParams.get("currentEventId")
    const limitParam = searchParams.get("limit")

    // Validate required parameters
    if (!creatorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: creatorId is required",
        },
        { status: 400 }
      )
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10

    // Fetch suggested events from Firebase
    // Path: events/{creatorId}/userEvents
    const eventsCollectionRef = adminDb
      .collection("events")
      .doc(creatorId)
      .collection("userEvents")
      .orderBy("createdAt", "desc")
      .limit(limit)

    const eventsSnapshot = await eventsCollectionRef.get()

    // Check if any events exist
    if (eventsSnapshot.empty) {
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      )
    }

    // Transform the events data
    const eventsData = []

    for (const doc of eventsSnapshot.docs) {
      // Skip the current event if currentEventId is provided
      if (currentEventId && doc.id === currentEventId) {
        continue
      }

      const data = doc.data()
      eventsData.push({
        id: doc.id,
        eventName: data?.eventName || "",
        eventImage: data?.eventImage || "",
        eventDate: data?.eventDate || "",
        eventVenue: data?.eventVenue || "",
      })
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: eventsData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=360",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching suggested events:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    )
  }
}