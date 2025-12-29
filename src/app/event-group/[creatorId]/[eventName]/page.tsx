import type { Metadata } from "next"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/app/lib/firebase"
import EventGroupClient from "./EventGroupClient"

interface Props {
  params: Promise<{
    creatorId: string
    eventName: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creatorId, eventName } = await params

  try {
    const decodedEventName = decodeURIComponent(eventName.replace(/\+/g, " "))

    // Try to fetch event group data for metadata
    const collectionDocRef = doc(db, "EventCollection", creatorId, "collections", decodedEventName)
    const collectionDoc = await getDoc(collectionDocRef)

    if (collectionDoc.exists()) {
      const data = collectionDoc.data()

      // Use original image URL directly
      const imageUrl = data.image || "/placeholder.svg?height=630&width=1200&query=event collection"

      return {
        title: `${data.name} - Event Collection | Spotix`,
        description: data.description || `Explore the ${data.name} event collection and its variations on Spotix`,
        openGraph: {
          title: `${data.name} - Event Collection`,
          description: data.description || `Explore the ${data.name} event collection and its variations`,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: data.name,
            },
          ],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: `${data.name} - Event Collection`,
          description: data.description || `Explore the ${data.name} event collection and its variations`,
          images: [imageUrl],
        },
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
  }

  // Fallback metadata
  return {
    title: `Event Collection - Spotix`,
    description: "Explore event collections on Spotix",
  }
}

export default async function EventGroupPage({ params }: Props) {
  const resolvedParams = await params
  return <EventGroupClient params={resolvedParams} />
}