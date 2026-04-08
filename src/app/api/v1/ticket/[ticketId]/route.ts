/**
 * app/api/v1/ticket/[ticketId]/route.ts
 *
 * GET /api/v1/ticket/[ticketId]  — Fetch a specific ticket by ID
 *
 * This route fetches a specific ticket from the tickets collection and verifies
 * that the authenticated user (by email) owns the ticket.
 *
 * Authentication:
 *   - Reads spotix_u_at cookie or Authorization: Bearer header
 *   - Verifies JWT token to extract user email
 *   - Ensures the ticket belongs to the authenticated user
 *
 * Response:
 *   - ticket: The ticket object with all details
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/app/lib/auth-tokens";
import { adminDb } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIENCE = "spotix-user" as const;
const DEV_TAG = "API developed and maintained by Spotix Technologies";

// ── Response helpers ───────────────────────────────────────────────────────────
function ok<T extends object>(data: T, status = 200) {
  return NextResponse.json({ ...data, developer: DEV_TAG }, { status });
}

function err(error: string, message: string, status: number, details?: string) {
  return NextResponse.json(
    { error, message, ...(details ? { details } : {}), developer: DEV_TAG },
    { status }
  );
}

// ── GET /api/v1/ticket/[ticketId] ──────────────────────────────────────────────
/**
 * Fetch a specific ticket by ID.
 *
 * Path Parameters:
 *   - ticketId: The Firestore document ID of the ticket
 *
 * Response:
 *   {
 *     success: boolean,
 *     ticket: {
 *       id: string,
 *       email: string,
 *       eventId: string,
 *       eventName: string,
 *       ticketType: string,
 *       ticketPrice: number,
 *       ticketReference: string,
 *       purchaseDate: string,
 *       purchaseTime: string,
 *       paymentMethod: string,
 *       ...other fields
 *     }
 *   }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;

    if (!ticketId) {
      return err("Bad Request", "Ticket ID is required", 400);
    }

    // 1. Extract and verify JWT token
    const cookieToken = request.cookies.get("spotix_u_at")?.value;
    const headerToken = request.headers.get("Authorization")?.replace("Bearer ", "");
    const token = cookieToken || headerToken;

    if (!token) {
      return err("Unauthorized", "No access token provided", 401);
    }

    let payload;
    try {
      payload = await verifyAccessToken(token, AUDIENCE);
    } catch (jwtErr: any) {
      return err(
        "Unauthorized",
        jwtErr.code === "ERR_JWT_EXPIRED"
          ? "Access token has expired"
          : "Invalid access token",
        401
      );
    }

    const userEmail = payload.email;
    if (!userEmail) {
      return err("Unauthorized", "User email not found in token", 401);
    }

    // 2. Fetch the specific ticket
    try {
      const ticketRef = adminDb.collection("tickets").doc(ticketId);
      const ticketDoc = await ticketRef.get();

      if (!ticketDoc.exists) {
        return err("Not Found", "Ticket not found", 404);
      }

      const data = ticketDoc.data()!;

      // 3. Verify that the ticket belongs to the authenticated user
      if (data.email !== userEmail) {
        return err(
          "Forbidden",
          "You do not have permission to access this ticket",
          403
        );
      }

      // 4. Format purchase date/time if they exist
      let purchaseDate = "N/A";
      let purchaseTime = "N/A";

      if (data.purchaseDate) {
        if (typeof data.purchaseDate === "string") {
          purchaseDate = data.purchaseDate;
          purchaseTime = data.purchaseTime || "N/A";
        } else if (data.purchaseDate.toDate) {
          const date = data.purchaseDate.toDate();
          purchaseDate = date.toLocaleDateString();
          purchaseTime = date.toLocaleTimeString();
        }
      }

      const ticket = {
        id: ticketId,
        email: data.email || "",
        eventId: data.eventId || "",
        eventName: data.eventName || "Unknown Event",
        eventType: data.eventType || "Unknown",
        ticketType: data.ticketType || "Standard",
        ticketPrice: data.ticketPrice || 0,
        ticketId: data.ticketId || "",
        ticketReference: data.ticketReference || "",
        purchaseDate: purchaseDate,
        purchaseTime: purchaseTime,
        paymentMethod: data.paymentMethod || "Wallet",
        eventCreatorId: data.eventCreatorId || "",
        eventDate: data.eventDate || "",
        eventEndDate: data.eventEndDate || "",
        eventStart: data.eventStart || "",
        eventEnd: data.eventEnd || "",
        eventVenue: data.eventVenue || "",
        stopDate: data.stopDate || "",
      };

      return ok({
        success: true,
        message: "Ticket retrieved successfully",
        ticket,
      });
    } catch (firestoreErr: any) {
      console.error("[ticket-detail] Firestore error:", firestoreErr);
      return err(
        "Database Error",
        "Failed to fetch ticket",
        500,
        firestoreErr.message
      );
    }
  } catch (error: any) {
    console.error("[ticket-detail] Unexpected error:", error);
    return err("Internal Server Error", "An unexpected error occurred", 500, error.message);
  }
}
