import ClientPage from "./ClientPage"
import type { Metadata } from "next"

interface EventType {
  id: string
  eventName: string
  eventImage: string
  eventImages: string[]
  eventDate: string
  eventEndDate: string
  eventStart: string
  eventEnd: string
  eventType: string
  isFree: boolean
  ticketPrices: { policy: string; price: number }[]
  bookerName: string
  bookerEmail?: string
  bookerPhone?: string
  isVerified?: boolean
  eventDescription?: string
  eventVenue: string
  colorCode?: string
  enableColorCode?: boolean
  enableMaxSize?: boolean
  maxSize?: string
  enableStopDate?: boolean
  stopDate?: string
  ticketsSold?: number
  createdBy: string
  likes?: number
  likedBy?: string[]
  allowAgents?: boolean
}

async function fetchEventData(creatorId: string, eventId: string): Promise<EventType | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://spotix.vercel.app"
    const response = await fetch(
      `${baseUrl}/api/v1/event?creatorId=${creatorId}&eventId=${eventId}`,
      {
        cache: "no-store", // Disable caching for dynamic event data
      }
    )

    if (!response.ok) {
      console.error("Failed to fetch event data:", response.statusText)
      return null
    }

    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error("Error fetching event data:", error)
    return null
  }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ creatorId: string; eventId: string }> }): Promise<Metadata> {
  try {
    const { creatorId, eventId } = await params

    if (!creatorId || !eventId) {
      return {
        title: "Event Not Found - Spotix",
        description: "The event you're looking for doesn't exist or has been removed.",
      }
    }

    // Fetch event data using API
    const eventData = await fetchEventData(creatorId, eventId)

    if (!eventData) {
      return {
        title: "Event Not Found - Spotix",
        description: "The event you're looking for doesn't exist or has been removed.",
      }
    }

    const eventDescription = eventData.eventDescription
      ? eventData.eventDescription.substring(0, 160)
      : `Join us for ${eventData.eventName} on ${new Date(eventData.eventDate).toLocaleDateString()}. ${eventData.isFree ? "Free event" : "Tickets available now"}!`

    const imageUrl =
      eventData.eventImage || `${process.env.NEXT_PUBLIC_BASE_URL || "https://spotix.vercel.app"}/placeholder.svg`

    return {
      title: `${eventData.eventName} - Spotix`,
      description: eventDescription,
      keywords: `${eventData.eventName}, ${eventData.eventType}, ${eventData.eventVenue}, events, tickets, spotix`,
      authors: [{ name: eventData.bookerName }],
      openGraph: {
        title: eventData.eventName,
        description: eventDescription,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: eventData.eventName,
          },
        ],
        type: "website",
        siteName: "Spotix",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: eventData.eventName,
        description: eventDescription,
        images: [imageUrl],
        site: "@spotix",
        creator: "@spotix",
      },
      other: {
        "event:start_time": new Date(eventData.eventDate).toISOString(),
        "event:end_time": eventData.eventEndDate ? new Date(eventData.eventEndDate).toISOString() : "",
        "event:location": eventData.eventVenue,
        "event:price": eventData.isFree ? "Free" : "Paid",
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Event - Spotix",
      description: "Discover amazing events on Spotix",
    }
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ creatorId: string; eventId: string }>
}) {
  const resolvedParams = await params
  
  // Fetch event data for SSR
  const eventData = await fetchEventData(resolvedParams.creatorId, resolvedParams.eventId)
  
  return <ClientPage params={resolvedParams} initialEventData={eventData} />
}