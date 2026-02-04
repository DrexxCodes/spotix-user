import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Atomic Operations API Route
 * Handles event statistics updates atomically
 * POST /api/v1/atomic-operations
 */

interface AtomicOperationsRequest {
  creatorId: string;
  eventId: string;
  ticketType: string;
  ticketPrice: number;
  discountCode?: string | null;
  ticketId: string;
}

interface TicketPrice {
  policy: string;
  price: number;
  availableTickets: number | null | undefined;
  [key: string]: any;
}

interface OperationsPerformed {
  ticketsSoldIncremented: boolean;
  revenueUpdated: boolean;
  availableTicketsDecremented: boolean;
  discountUpdated: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: AtomicOperationsRequest = await req.json();
    const { creatorId, eventId, ticketType, ticketPrice, discountCode, ticketId } = body;

    // Validate required fields
    if (!creatorId || !eventId || !ticketType || ticketPrice === undefined || !ticketId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields: creatorId, eventId, ticketType, ticketPrice, ticketId",
        },
        { status: 400 }
      );
    }

    console.log(`[Atomic Ops] Processing for ticketId: ${ticketId}, eventId: ${eventId}`);

    const eventDocRef = adminDb
      .collection("events")
      .doc(creatorId)
      .collection("userEvents")
      .doc(eventId);

    // Check if this ticket has already been processed atomically
    const processedRef = eventDocRef.collection("_processedTickets").doc(ticketId);
    const processedDoc = await processedRef.get();

    if (processedDoc.exists) {
      console.log(`[Atomic Ops] Ticket ${ticketId} already processed - skipping duplicate operation`);
      return NextResponse.json(
        {
          success: true,
          message: "Operation already processed (idempotent)",
          ticketId,
          alreadyProcessed: true,
        },
        { status: 200 }
      );
    }

    // Perform atomic operations in a transaction
    const operationsPerformed: OperationsPerformed = {
      ticketsSoldIncremented: false,
      revenueUpdated: false,
      availableTicketsDecremented: false,
      discountUpdated: false,
    };

    await adminDb.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventDocRef);

      if (!eventDoc.exists) {
        throw new Error(`Event not found: ${eventId}`);
      }

      const eventData = eventDoc.data();
      const ticketPrices: TicketPrice[] = eventData?.ticketPrices || [];

      // Find matching ticket type and decrement availableTickets
      const updatedTicketPrices = ticketPrices.map((ticket) => {
        // Match by policy (ticket type)
        if (ticket.policy === ticketType) {
          // Only decrement if availableTickets is defined and > 0
          if (
            ticket.availableTickets !== null &&
            ticket.availableTickets !== undefined &&
            ticket.availableTickets > 0
          ) {
            operationsPerformed.availableTicketsDecremented = true;
            return {
              ...ticket,
              availableTickets: ticket.availableTickets - 1,
            };
          } else if (ticket.availableTickets === null || ticket.availableTickets === undefined) {
            // Unlimited tickets - no decrement needed
            console.log(`[Atomic Ops] Ticket type ${ticketType} has unlimited availability`);
          } else {
            console.warn(`[Atomic Ops] Ticket type ${ticketType} has no available tickets left`);
          }
        }
        return ticket;
      });

      // Update event document atomically
      transaction.update(eventDocRef, {
        ticketsSold: FieldValue.increment(1),
        totalRevenue: FieldValue.increment(Number(ticketPrice)),
        ticketPrices: updatedTicketPrices,
      });

      operationsPerformed.ticketsSoldIncremented = true;
      operationsPerformed.revenueUpdated = true;

      // Mark this ticket as processed to prevent duplicate operations
      transaction.set(processedRef, {
        ticketId,
        ticketType,
        ticketPrice: Number(ticketPrice),
        processedAt: FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      console.log(`[Atomic Ops] Transaction completed for ticketId: ${ticketId}`);
    });

    // Handle discount usage outside transaction (uses its own atomic increment)
    if (discountCode) {
      try {
        const discountDocRef = adminDb
          .collection("events")
          .doc(creatorId)
          .collection("userEvents")
          .doc(eventId)
          .collection("discounts")
          .doc(discountCode);

        const discountDoc = await discountDocRef.get();

        if (discountDoc.exists) {
          await discountDocRef.update({
            usedCount: FieldValue.increment(1),
          });
          operationsPerformed.discountUpdated = true;
          console.log(`[Atomic Ops] Discount ${discountCode} usage incremented`);
        }
      } catch (discountError) {
        console.error(`[Atomic Ops] Error updating discount:`, discountError);
        // Don't fail the entire operation if discount update fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Atomic operations completed successfully",
        ticketId,
        eventId,
        operationsPerformed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Atomic Ops] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to perform atomic operations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET handler for health check
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "Atomic Operations API",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}