import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Analytics API Route
 * 
 * POST: Update global platform analytics (daily, monthly, yearly)
 * GET: Friendly message (not meant for public access)
 */

/**
 * GET Handler
 * Returns a friendly message for unauthorized access
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: "You're not meant to be here but welcome to the analytics API",
      hint: "This endpoint accepts POST requests to update analytics data",
      developer: "API developed and maintained by Spotix Technologies",
    },
    { status: 200 }
  );
}

/**
 * POST Handler
 * Update global analytics when a ticket is sold
 * 
 * Body:
 * {
 *   ticketPrice: number,
 *   ticketId: string,
 *   eventId: string,
 *   timestamp: string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketPrice, ticketId, eventId, timestamp } = body;

    // Validate required fields
    if (!ticketPrice || !ticketId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields: ticketPrice, ticketId",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Parse ticket price as number
    const price = Number(ticketPrice);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid ticket price. Must be a positive number.",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Get current time in Nigerian timezone (WAT - UTC+1)
    const now = timestamp ? new Date(timestamp) : new Date();
    const nigerianTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour for WAT

    // Format date strings for Nigerian timezone
    const year = nigerianTime.getUTCFullYear().toString();
    const month = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, "0")}`;
    const day = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, "0")}-${String(nigerianTime.getUTCDate()).padStart(2, "0")}`;

    console.log("Updating analytics:", {
      ticketId,
      price,
      year,
      month,
      day,
      nigerianTime: nigerianTime.toISOString(),
    });

    // Prepare update data
    const updateData = {
      ticketsSold: FieldValue.increment(1),
      totalRevenue: FieldValue.increment(price),
      lastUpdated: FieldValue.serverTimestamp(),
    };

    // Create batch to update all three levels atomically
    const batch = adminDb.batch();

    // Daily stats
    const dailyRef = adminDb.collection("admin").doc("analytics").collection("daily").doc(day);
    batch.set(dailyRef, updateData, { merge: true });

    // Monthly stats
    const monthlyRef = adminDb.collection("admin").doc("analytics").collection("monthly").doc(month);
    batch.set(monthlyRef, updateData, { merge: true });

    // Yearly stats
    const yearlyRef = adminDb.collection("admin").doc("analytics").collection("yearly").doc(year);
    batch.set(yearlyRef, updateData, { merge: true });

    // Commit all updates atomically
    await batch.commit();

    console.log("Analytics updated successfully:", {
      ticketId,
      day,
      month,
      year,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Analytics updated successfully",
        data: {
          ticketId,
          ticketPrice: price,
          day,
          month,
          year,
          nigerianTime: nigerianTime.toISOString(),
        },
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating analytics:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to update analytics",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}