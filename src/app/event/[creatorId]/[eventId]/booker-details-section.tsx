"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { Calendar, MapPin, User } from "lucide-react"

interface BookerDetailsSectionProps {
  bookerDetails: {
    username: string
    email: string
    phone: string
    isVerified: boolean
  } | null
  bookerName: string
  creatorId: string
}

interface SuggestedEvent {
  id: string
  eventName: string
  eventImage: string
  eventDate: string
  eventVenue: string
  ticketsSold?: number
}

const BookerDetailsSection: React.FC<BookerDetailsSectionProps> = ({ bookerDetails, bookerName, creatorId }) => {
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const params = useParams()
  const currentEventId = params?.eventId as string

  useEffect(() => {
    const fetchSuggestedEvents = async () => {
      if (!creatorId) return

      setLoadingSuggestions(true)
      try {
        const eventsRef = collection(db, "events", creatorId, "userEvents")
        const q = query(eventsRef, orderBy("createdAt", "desc"), limit(10))
        const querySnapshot = await getDocs(q)

        const events: SuggestedEvent[] = []
        querySnapshot.forEach((doc) => {
          // Exclude the current event being viewed
          if (doc.id !== currentEventId) {
            const data = doc.data()
            events.push({
              id: doc.id,
              eventName: data.eventName,
              eventImage: data.eventImage,
              eventDate: data.eventDate,
              eventVenue: data.eventVenue,
              ticketsSold: data.ticketsSold || 0,
            })
          }
        })

        // Shuffle and take 3 random events
        const shuffled = events.sort(() => 0.5 - Math.random())
        setSuggestedEvents(shuffled.slice(0, 3))
      } catch (error) {
        console.error("Error fetching suggested events:", error)
      } finally {
        setLoadingSuggestions(false)
      }
    }

    fetchSuggestedEvents()
  }, [creatorId, currentEventId])

  const handleEventClick = (eventId: string) => {
    window.open(`/event/${creatorId}/${eventId}`, "_blank")
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <User size={24} className="text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Event Organizer</h2>
      </div>

      {bookerDetails ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Organizer:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-800">{bookerDetails.username}</span>
                {bookerDetails.isVerified && (
                  <span
                    className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                    title="Verified Organizer"
                  >
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Email:</span>
              <span className="text-gray-800">{bookerDetails.email}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Phone:</span>
              <span className="text-gray-800">{bookerDetails.phone}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bookerDetails.isVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {bookerDetails.isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading organizer details...</p>
        </div>
      )}

      {/* Suggested Events Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">You might also like these events from {bookerName}</h3>

        {loadingSuggestions ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
                <div className="h-24 md:h-32 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-2 bg-gray-200 rounded mb-1"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : suggestedEvents.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEventClick(event.id)}
              >
                <div className="h-24 md:h-32 overflow-hidden">
                  <img
                    src={event.eventImage || "/placeholder.svg"}
                    alt={event.eventName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 md:p-3">
                  <h4 className="font-medium text-gray-800 mb-1 line-clamp-2 text-xs md:text-sm">{event.eventName}</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={8} className="md:w-2.5 md:h-2.5" />
                      <span className="truncate">{new Date(event.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={8} className="md:w-2.5 md:h-2.5" />
                      <span className="truncate">{event.eventVenue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No other events available from this organizer at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookerDetailsSection
