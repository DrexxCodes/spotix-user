import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const creatorId = searchParams.get("creatorId")
    const eventId = searchParams.get("eventId")

    // Validate required parameters
    if (!creatorId || !eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: creatorId and eventId are required",
        },
        { status: 400 }
      )
    }

    // Fetch event data from Firebase
    // Path: events/{creatorId}/userEvents/{eventId}
    const eventDocRef = adminDb
      .collection("events")
      .doc(creatorId)
      .collection("userEvents")
      .doc(eventId)

    const eventDoc = await eventDocRef.get()

    // Check if event exists
    if (!eventDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      )
    }

    // Get event data
    const eventData = eventDoc.data()

    // Transform the data to match the expected EventType interface
    const transformedData = {
      id: eventDoc.id,
      eventName: eventData?.eventName || "",
      eventImage: eventData?.eventImage || "",
      eventImages: eventData?.eventImages || [],
      eventDate: eventData?.eventDate || "",
      eventEndDate: eventData?.eventEndDate || "",
      eventStart: eventData?.eventStart || "",
      eventEnd: eventData?.eventEnd || "",
      eventType: eventData?.eventType || "",
      isFree: eventData?.isFree || false,
      ticketPrices: eventData?.ticketPrices || [],
      bookerName: eventData?.bookerName || "",
      bookerEmail: eventData?.bookerEmail,
      bookerPhone: eventData?.bookerPhone,
      isVerified: eventData?.isVerified || false,
      eventDescription: eventData?.eventDescription,
      eventVenue: eventData?.eventVenue || "",
      colorCode: eventData?.colorCode,
      enableColorCode: eventData?.enableColorCode || false,
      enableMaxSize: eventData?.enableMaxSize || false,
      maxSize: eventData?.maxSize,
      enableStopDate: eventData?.enableStopDate || false,
      stopDate: eventData?.stopDate,
      ticketsSold: eventData?.ticketsSold || 0,
      createdBy: eventData?.createdBy || creatorId,
      likes: eventData?.likes || 0,
      likedBy: eventData?.likedBy || [],
      allowAgents: eventData?.allowAgents || false,
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: transformedData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching event data:", error)
    
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