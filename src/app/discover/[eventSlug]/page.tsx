import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import DiscoverClient from "./discover-Client"

interface DiscoverPageProps {
  params: Promise<{
    eventSlug: string
  }>
}

async function getEventData(eventSlug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/v1/discover/${eventSlug}`, {
      cache: "no-store", // Always fetch fresh data for OG tags
      headers: {
        "User-Agent": "Spotix-Bot/1.0", // Identify as our own crawler
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch event data: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching event data:", error)
    return null
  }
}

export async function generateMetadata({ params }: DiscoverPageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const eventData = await getEventData(eventSlug)

  if (!eventData || !eventData.eventData) {
    return {
      title: "Event Not Found - Spotix",
      description: "The event you are looking for could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const event = eventData.eventData
  const bookerId = eventData.bookerId
  const eventId = eventData.eventId

  // Use the original image URL directly (not optimized) for better OG tag compatibility
  const imageUrl = event.originalImage || event.image || "/community-event.png"
  
  // Construct the canonical URL
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://spotix.com.ng"}/event/${bookerId}/${eventId}`
  const discoverUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://spotix.com.ng"}/discover/${eventSlug}`

  // Format event date
  const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : undefined

  // Format price for display
  const eventPrice = event.price === "Free" ? "Free Event" : `From ₦${event.price}`

  // Create description
  const description = event.description || 
    `Join us for ${event.name}${eventDate ? ` on ${eventDate}` : ''} at ${event.location || 'our venue'}. ${eventPrice}.`

  return {
    title: `${event.name} - Spotix`,
    description: description.substring(0, 160),
    keywords: [
      event.name, 
      "Spotix", 
      "event", 
      "tickets", 
      event.category, 
      event.location,
      ...(event.tags || [])
    ].filter(Boolean).join(", "),
    authors: [{ name: event.organizer || "Spotix" }],
    
    // Open Graph tags for social media sharing
    openGraph: {
      title: event.name,
      description: description.substring(0, 200),
      url: canonicalUrl,
      siteName: "Spotix",
      locale: "en_NG",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.name,
          type: "image/jpeg",
        },
      ],
    },
    
    // Twitter Card tags
    twitter: {
      card: "summary_large_image",
      title: event.name,
      description: description.substring(0, 200),
      images: [imageUrl],
      site: "@spotix",
      creator: "@spotix",
    },
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Additional meta tags
    other: {
      // Event-specific meta tags
      "event:name": event.name,
      "event:description": event.description || "",
      "event:location": event.location || "",
      "event:date": event.date || "",
      "event:start_time": event.startTime || "",
      "event:end_time": event.endTime || "",
      "event:price": eventPrice,
      "event:organizer": event.organizer || "Spotix",
      "event:category": event.category || "",
      "event:capacity": event.capacity ? String(event.capacity) : "",
      "event:verified": event.isVerified ? "true" : "false",
      
      // SEO tags
      "og:image:secure_url": imageUrl,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": event.name,
      "og:image:type": "image/jpeg",
      
      // Structured data as JSON-LD (will be rendered in head)
      "application/ld+json": JSON.stringify(event.structuredData || {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.name,
        description: event.description,
        image: imageUrl,
        startDate: event.date,
        endDate: event.endDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.location || "Event Venue",
          address: event.location || "",
        },
        organizer: {
          "@type": "Organization",
          name: event.organizer || "Spotix",
          url: "https://spotix.com.ng",
        },
        offers: event.price === "Free" ? {
          "@type": "Offer",
          price: "0",
          priceCurrency: "NGN",
          availability: "https://schema.org/InStock",
          url: canonicalUrl,
        } : (event.ticketPrices && event.ticketPrices.length > 0 ? 
          event.ticketPrices.map((ticket: any) => ({
            "@type": "Offer",
            price: String(ticket.price),
            priceCurrency: "NGN",
            name: ticket.policy || "Ticket",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          })) : {
            "@type": "Offer",
            price: String(event.price),
            priceCurrency: "NGN",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          }
        ),
      }),
    },
    
    // Robots configuration
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const { eventSlug } = await params
  const eventData = await getEventData(eventSlug)

  // If we have valid event data, redirect immediately
  if (eventData && eventData.bookerId && eventData.eventId) {
    redirect(`/event/${eventData.bookerId}/${eventData.eventId}`)
  }

  // If no event data, show the client component with error handling
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading event...</p>
          </div>
        </div>
      }
    >
      <DiscoverClient eventSlug={eventSlug} />
    </Suspense>
  )
}