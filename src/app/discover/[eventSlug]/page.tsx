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
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/discover/${eventSlug}`, {
      cache: "no-store", // Always fetch fresh data for OG tags
      headers: {
        "User-Agent": "Spotix-Bot/1.0", // Identify as our own crawler
      },
    })

    if (!response.ok) {
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

  if (!eventData) {
    return {
      title: "Event Not Found - Spotix",
      description: "The event you are looking for could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const { eventData: event } = eventData

  const eventDate = event.date ? new Date(event.date).toISOString() : undefined
  const eventLocation = event.location || "Online Event"
  const eventPrice = event.price === "Free" ? "Free" : `From ${event.price}`

  return {
    title: `${event.name} - Spotix`,
    description: event.description,
    keywords: [event.name, "Spotix", "event", "tickets", event.category, ...(event.tags || [])]
      .filter(Boolean)
      .join(", "),
    authors: [{ name: event.organizer || "Spotix" }],
    openGraph: {
      title: event.name,
      description: event.description,
      images: [
        {
          url: event.image,
          width: 1200,
          height: 630,
          alt: event.name,
        },
      ],
      type: "website",
      siteName: "Spotix",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: event.name,
      description: event.description,
      images: [event.image],
      site: "@spotix",
    },
    alternates: {
      canonical: `https://spotix.com/discover/${eventSlug}`,
    },
    other: {
      "event:name": event.name,
      "event:description": event.description,
      "event:location": eventLocation,
      "event:date": eventDate || "",
      "event:price": eventPrice,
      "event:organizer": event.organizer || "Spotix",
      "event:category": event.category || "",
      "event:capacity": event.capacity || "",
      "event:verified": event.isVerified ? "true" : "false",
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <DiscoverClient eventSlug={eventSlug} />
    </Suspense>
  )
}
