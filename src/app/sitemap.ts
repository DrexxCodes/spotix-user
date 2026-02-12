import { MetadataRoute } from 'next'
import { adminDb } from '@/app/lib/firebase-admin'

// Base URL for your site
const BASE_URL = 'https://spotix.com.ng'

interface UserEvent {
  eventName: string
  eventImage?: string
  eventDate?: string
  eventEndDate?: string
  createdBy?: string
  isVerified?: boolean
  isFree?: boolean
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes — only pages that are publicly indexable and SEO-relevant
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      images: [`${BASE_URL}/logo-full.png`],
    },
    {
      url: `${BASE_URL}/home`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      images: [`${BASE_URL}/logo-full.png`],
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vote`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/iwss`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  try {
    // Use collectionGroup to query ALL userEvents across every creatorId
    // This mirrors the data structure: events/{creatorId}/userEvents/{eventId}
    const eventsSnapshot = await adminDb
      .collectionGroup('userEvents')
      .orderBy('eventDate', 'desc')
      .limit(5000)
      .get()

    const eventRoutes: MetadataRoute.Sitemap = []

    eventsSnapshot.docs.forEach((doc) => {
      const event = doc.data() as UserEvent

      // Extract creatorId from the document reference path:
      // path is: events/{creatorId}/userEvents/{eventId}
      const pathSegments = doc.ref.path.split('/')
      const creatorId = pathSegments[1]
      const eventId = doc.id

      if (!creatorId || !eventId) return

      const eventDate = event.eventDate ? new Date(event.eventDate) : null
      const now = new Date()
      const isUpcoming = eventDate ? eventDate >= now : false

      eventRoutes.push({
        url: `${BASE_URL}/event/${creatorId}/${eventId}`,
        lastModified: eventDate || new Date(),
        // 'monthly' signals roughly twice-a-month crawling to search engines
        changeFrequency: 'monthly',
        // Upcoming events get a higher priority than past ones
        priority: isUpcoming ? 0.8 : 0.4,
        images: event.eventImage ? [event.eventImage] : undefined,
      })
    })

    return [...staticRoutes, ...eventRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Gracefully fall back to static routes if Firebase fails
    return staticRoutes
  }
}