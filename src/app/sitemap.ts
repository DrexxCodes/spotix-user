import { MetadataRoute } from 'next'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (only if not already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// Base URL for your site
const BASE_URL = 'https://spotix.com.ng'

interface PublicEvent {
  eventName: string
  creatorID: string
  eventId: string
  eventStartDate: string
  timestamp: any
  eventGroup?: boolean
  imageURL?: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes with priorities and change frequencies
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
      changeFrequency: 'hourly',
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
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/iwss`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/vote`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/booker-confirm`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/iwss/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/ticket-history`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
  ]

  try {
    // Fetch all public events from Firebase
    const publicEventsQuery = query(
      collection(db, 'publicEvents'),
      orderBy('timestamp', 'desc'),
      limit(1000) // Adjust limit based on your needs
    )
    
    const eventsSnapshot = await getDocs(publicEventsQuery)
    
    const eventRoutes: MetadataRoute.Sitemap = []
    const eventGroupRoutes: MetadataRoute.Sitemap = []

    eventsSnapshot.docs.forEach((doc) => {
      const event = doc.data() as PublicEvent

      // Check if it's an event group
      if (event.eventGroup === true) {
        // Event Collection route
        const encodedEventName = encodeURIComponent(event.eventName)
        eventGroupRoutes.push({
          url: `${BASE_URL}/event-group/${event.creatorID}/${encodedEventName}`,
          lastModified: event.timestamp?.toDate() || new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          images: event.imageURL ? [event.imageURL] : undefined,
        })
      } else {
        // Individual Event route
        const eventId = event.eventId || doc.id
        const eventDate = event.eventStartDate ? new Date(event.eventStartDate) : new Date()
        const now = new Date()
        
        // Determine if event is upcoming or past
        const isUpcoming = eventDate >= now
        
        eventRoutes.push({
          url: `${BASE_URL}/event/${event.creatorID}/${eventId}`,
          lastModified: event.timestamp?.toDate() || new Date(),
          changeFrequency: isUpcoming ? 'daily' : 'monthly',
          priority: isUpcoming ? 0.8 : 0.5,
          images: event.imageURL ? [event.imageURL] : undefined,
        })
      }
    })

    // Combine all routes
    return [...staticRoutes, ...eventRoutes, ...eventGroupRoutes]
    
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes only if Firebase fetch fails
    return staticRoutes
  }
}