import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const creatorId = searchParams.get("creatorId")

    // Validate required parameter
    if (!creatorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: creatorId is required",
        },
        { status: 400 }
      )
    }

    // Fetch creator/booker details from Firebase
    // Path: users/{creatorId}
    const userDocRef = adminDb.collection("users").doc(creatorId)
    const userDoc = await userDocRef.get()

    // Check if user exists
    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator not found",
        },
        { status: 404 }
      )
    }

    // Get user data
    const userData = userDoc.data()

    // Transform the data to match the expected structure
    const bookerDetails = {
      username: userData?.username || userData?.displayName || "Unknown User",
      email: userData?.email || "",
      phone: userData?.phone || userData?.phoneNumber || "",
      isVerified: userData?.isVerified || false,
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: bookerDetails,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching creator details:", error)
    
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