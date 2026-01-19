import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"

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

    // Fetch the actual event data
    const eventDocRef = adminDb.collection("events").doc(bookerId).collection("userEvents").doc(eventId)
    const eventDoc = await eventDocRef.get()

    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const eventData = eventDoc.data()

    // Ensure image URL is absolute for OG tags
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://spotix.com.ng"
    let eventImage = eventData?.eventImage || "/community-event.png"
    
    // Make sure image URL is absolute
    if (eventImage && !eventImage.startsWith('http')) {
      eventImage = `${baseUrl}${eventImage.startsWith('/') ? '' : '/'}${eventImage}`
    }

    // Format ticket prices for display
    const ticketPrices = eventData?.ticketPrices || []
    const lowestPrice = ticketPrices.length > 0 
      ? Math.min(...ticketPrices.map((t: any) => t.price || 0))
      : null

    // Create optimized event data for metadata
    const optimizedEventData = {
      name: eventData?.eventName || "Spotix Event",
      description: eventData?.eventDescription || "Join us for an amazing event on Spotix!",
      image: eventImage,
      originalImage: eventImage, // Keep original for OG tags
      date: eventData?.eventDate,
      endDate: eventData?.eventEndDate,
      location: eventData?.eventVenue || "Event Venue",
      price: eventData?.isFree ? "Free" : (lowestPrice ? String(lowestPrice) : "Paid"),
      category: eventData?.eventType || "Event",
      organizer: eventData?.bookerName || "Spotix",
      capacity: eventData?.maxSize,
      tags: eventData?.tags || [],
      
      // Additional fields for better SEO
      startTime: eventData?.eventStart,
      endTime: eventData?.eventEnd,
      ticketPrices: ticketPrices,
      isVerified: eventData?.isVerified || false,
      
      // Structured data for rich snippets
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Event",
        name: eventData?.eventName || "Spotix Event",
        description: eventData?.eventDescription || "Join us for an amazing event on Spotix!",
        image: eventImage,
        startDate: eventData?.eventDate,
        endDate: eventData?.eventEndDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        
        location: {
          "@type": "Place",
          name: eventData?.eventVenue || "Event Venue",
          address: {
            "@type": "PostalAddress",
            addressLocality: eventData?.eventVenue || "Event Venue",
            addressCountry: "NG",
          },
        },
        
        organizer: {
          "@type": "Organization",
          name: eventData?.bookerName || "Spotix",
          url: baseUrl,
        },
        
        offers: eventData?.isFree
          ? {
              "@type": "Offer",
              price: "0",
              priceCurrency: "NGN",
              availability: "https://schema.org/InStock",
              url: `${baseUrl}/event/${bookerId}/${eventId}`,
              validFrom: eventData?.createdAt || new Date().toISOString(),
            }
          : ticketPrices.length > 0
            ? ticketPrices.map((ticket: any) => ({
                "@type": "Offer",
                price: String(ticket.price || 0),
                priceCurrency: "NGN",
                name: ticket.policy || "Ticket",
                description: ticket.description || "",
                availability: "https://schema.org/InStock",
                url: `${baseUrl}/event/${bookerId}/${eventId}`,
                validFrom: eventData?.createdAt || new Date().toISOString(),
              }))
            : {
                "@type": "Offer",
                price: "0",
                priceCurrency: "NGN",
                availability: "https://schema.org/InStock",
                url: `${baseUrl}/event/${bookerId}/${eventId}`,
                validFrom: eventData?.createdAt || new Date().toISOString(),
              },
        
        // Additional properties for better SEO
        performer: {
          "@type": "Organization",
          name: eventData?.bookerName || "Spotix",
        },
      },
    }

    const response = NextResponse.json({
      bookerId,
      eventId,
      eventData: optimizedEventData,
    })

    // Set cache headers for better performance
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    
    // Allow search engines to index
    response.headers.set("X-Robots-Tag", "index, follow, max-image-preview:large")
    
    // Set content type
    response.headers.set("Content-Type", "application/json; charset=utf-8")
    
    // Add CORS headers for crawlers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")

    return response
  } catch (error) {
    console.error("Error resolving shortlink:", error)
    return NextResponse.json({ error: "Failed to resolve shortlink" }, { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, User-Agent",
    },
  })
}