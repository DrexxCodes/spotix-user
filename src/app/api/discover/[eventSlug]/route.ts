import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "../../../lib/firebase-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventSlug: string }> }) {
  try {
    const { eventSlug } = await params

    if (!eventSlug) {
      return NextResponse.json({ error: "No event slug provided" }, { status: 400 })
    }

    // Look up the shortlink in the Links collection
    const linkDocRef = adminDb.collection("Links").doc(eventSlug)
    const linkDoc = await linkDocRef.get()

    if (!linkDoc.exists) {
      return NextResponse.json({ error: "Shortlink not found" }, { status: 404 })
    }

    const linkData = linkDoc.data()
    const { bookerId, eventId } = linkData || {}

    if (!bookerId || !eventId) {
      return NextResponse.json({ error: "Invalid shortlink data" }, { status: 400 })
    }

    const eventDocRef = adminDb.collection("events").doc(bookerId).collection("userEvents").doc(eventId)
    const eventDoc = await eventDocRef.get()

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const eventData = eventDoc.data()

   const optimizedEventData = {
  name: eventData?.eventName || "Spotix Event",
  description: eventData?.eventDescription || "Join us for an amazing event on Spotix!",
  image: eventData?.eventImage || "/community-event.png",
  originalImage: eventData?.eventImage || "/community-event.png",
  date: eventData?.eventDate,
  location: eventData?.eventVenue,
  price: eventData?.isFree ? "Free" : eventData?.ticketPrices?.[0]?.price || "Paid",
  category: eventData?.eventType,
  organizer: eventData?.bookerName,
  capacity: eventData?.maxSize,
  tags: eventData?.tags || [],
  // Additional fields for better SEO
  startTime: eventData?.eventStart,
  endTime: eventData?.eventEnd,
  endDate: eventData?.eventEndDate,
  ticketPrices: eventData?.ticketPrices || [],
  isVerified: eventData?.isVerified || false,
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventData?.eventName,
    description: eventData?.eventDescription,
    image: eventData?.eventImage || "/community-event.png",
    startDate: eventData?.eventDate,
    endDate: eventData?.eventEndDate,
        location: {
          "@type": "Place",
          name: eventData?.eventVenue,
        },
        organizer: {
          "@type": "Person",
          name: eventData?.bookerName,
        },
        offers: eventData?.isFree
          ? {
              "@type": "Offer",
              price: "0",
              priceCurrency: "NGN",
              availability: "https://schema.org/InStock",
            }
          : eventData?.ticketPrices?.map((ticket: any) => ({
              "@type": "Offer",
              price: ticket.price,
              priceCurrency: "NGN",
              name: ticket.policy,
            })),
      },
    }

    const response = NextResponse.json({
      bookerId,
      eventId,
      eventData: optimizedEventData,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("X-Robots-Tag", "index, follow")
    response.headers.set("Content-Type", "application/json; charset=utf-8")

    return response
  } catch (error) {
    console.error("Error resolving shortlink:", error)
    return NextResponse.json({ error: "Failed to resolve shortlink" }, { status: 500 })
  }
}
