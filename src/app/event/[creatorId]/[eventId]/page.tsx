import ClientPage from "./ClientPage"
import type { Metadata } from "next"
import { adminDb } from "@/app/lib/firebase-admin"

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
    // Use Firebase Admin SDK directly (same as API route)
    const eventDocRef = adminDb
      .collection("events")
      .doc(creatorId)
      .collection("userEvents")
      .doc(eventId)

    const eventDoc = await eventDocRef.get()

    if (!eventDoc.exists) {
      return null
    }

    const eventData = eventDoc.data()

    // Transform the data to match EventType interface
    return {
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

    // Fetch event data directly from Firestore (no API call)
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
  
  // Fetch event data for SSR (reuses same function)
  const eventData = await fetchEventData(resolvedParams.creatorId, resolvedParams.eventId)
  
  return <ClientPage params={resolvedParams} initialEventData={eventData} />
}