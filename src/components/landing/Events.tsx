"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Tag, Palette, ChevronLeft, ChevronRight } from "lucide-react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "../lib/firebase"
import useSWR from "swr"

interface FeaturedEvent {
  id: string
  eventName: string
  imageURL: string
  eventType: string
  venue: string
  eventStartDate: string
  freeOrPaid: boolean
  creatorID: string
  eventId: string
  bookerName: string
}

interface ThemedEvent extends FeaturedEvent {
  theme: string
  themeColor?: string
}

// Fetcher functions for SWR
const fetchFeaturedEvents = async (): Promise<FeaturedEvent[]> => {
  const featuredQuery = query(
    collection(db, "featuredEvents"),
    orderBy("addedAt", "desc"),
    limit(5)
  )
  const featuredSnapshot = await getDocs(featuredQuery)

  if (featuredSnapshot.empty) return []

  const events: FeaturedEvent[] = []

  featuredSnapshot.docs.forEach((doc) => {
    const featuredData = doc.data()
    if (featuredData.eventId && featuredData.creatorID) {
      events.push({
        id: doc.id,
        eventName: featuredData.eventName,
        imageURL: featuredData.imageURL,
        eventType: featuredData.eventType,
        venue: featuredData.venue,
        eventStartDate: featuredData.eventStartDate,
        freeOrPaid: featuredData.freeOrPaid,
        creatorID: featuredData.creatorID,
        eventId: featuredData.eventId,
        bookerName: featuredData.bookerName || "Event Organizer",
      })
    }
  })

  return events
}

const fetchThemedEvents = async (): Promise<ThemedEvent[]> => {
  const themedQuery = query(
    collection(db, "themedEvents"),
    orderBy("addedAt", "desc"),
    limit(8)
  )
  const themedSnapshot = await getDocs(themedQuery)

  if (themedSnapshot.empty) return []

  const events: ThemedEvent[] = []

  themedSnapshot.docs.forEach((doc) => {
    const themedData = doc.data()
    if (themedData.eventId && themedData.creatorID) {
      events.push({
        id: doc.id,
        eventName: themedData.eventName,
        imageURL: themedData.imageURL,
        eventType: themedData.eventType,
        venue: themedData.venue,
        eventStartDate: themedData.eventStartDate,
        freeOrPaid: themedData.freeOrPaid,
        creatorID: themedData.creatorID,
        eventId: themedData.eventId,
        bookerName: themedData.bookerName || "Event Organizer",
        theme: themedData.theme || "Featured",
        themeColor: themedData.themeColor || "#6b2fa5",
      })
    }
  })

  return events
}

// Skeleton Components
const FeaturedEventSkeleton = () => (
  <div className="relative h-[500px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl overflow-hidden animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
      <div className="h-8 bg-gray-300/50 rounded-lg w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-300/50 rounded w-1/2" />
        <div className="h-4 bg-gray-300/50 rounded w-2/3" />
        <div className="h-4 bg-gray-300/50 rounded w-1/3" />
      </div>
      <div className="h-6 bg-gray-300/50 rounded-full w-24" />
      <div className="h-12 bg-gray-300/50 rounded-full w-40" />
    </div>
  </div>
)

const ThemedEventSkeleton = () => (
  <div className="group rounded-2xl overflow-hidden bg-white border-2 border-gray-200 animate-pulse">
    <div className="relative h-48 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20" />
    </div>
  </div>
)

const Events = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)

  // SWR hooks with revalidation options
  const {
    data: featuredEvents = [],
    isLoading: loadingFeatured,
  } = useSWR("featuredEvents", fetchFeaturedEvents, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10 * 60 * 1000, // 10 minutes
  })

  const {
    data: themedEvents = [],
    isLoading: loadingThemed,
  } = useSWR("themedEvents", fetchThemedEvents, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10 * 60 * 1000, // 10 minutes
  })

  // Auto-rotate featured events every 8 seconds (pauses on hover)
  useEffect(() => {
    if (featuredEvents.length === 0 || isHovered) return

    autoRotateRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredEvents.length)
    }, 8000)

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [featuredEvents.length, isHovered])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? featuredEvents.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % featuredEvents.length)
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatShortDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  // Get the current active event for the View Details button
  const currentEvent = featuredEvents[activeIndex]

  return (
    <section id="events" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Featured Events Section */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-[#6b2fa5] via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Featured Events
          </h2>

          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {loadingFeatured ? (
              <FeaturedEventSkeleton />
            ) : featuredEvents.length > 0 ? (
              <>
                {/* Carousel Container */}
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  {featuredEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === activeIndex
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-105"
                      }`}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <Image
                          src={event.imageURL || "/placeholder.svg"}
                          alt={event.eventName}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                        <div className="max-w-3xl">
                          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                            {event.eventName}
                          </h3>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-lg">
                              <Calendar className="w-5 h-5 text-purple-300" />
                              <span>{formatDate(event.eventStartDate)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-lg">
                              <MapPin className="w-5 h-5 text-purple-300" />
                              <span>{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-3 text-lg">
                              <Tag className="w-5 h-5 text-purple-300" />
                              <span>{event.eventType}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <span
                              className={`px-4 py-2 rounded-full font-semibold text-sm ${
                                !event.freeOrPaid
                                  ? "bg-green-500 text-white"
                                  : "bg-yellow-400 text-gray-900"
                              }`}
                            >
                              {!event.freeOrPaid ? "Free Entry" : "Paid Event"}
                            </span>
                          </div>

                          {/* View Details Button - Links to current active event */}
                          {currentEvent && (
                            <Link
                              href={`/event/${currentEvent.creatorID}/${currentEvent.eventId}`}
                              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                            >
                              View Details
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Navigation Arrows */}
                  {featuredEvents.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 group"
                        aria-label="Previous event"
                      >
                        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 group"
                        aria-label="Next event"
                      >
                        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      </button>
                    </>
                  )}
                </div>

                {/* Indicators */}
                {featuredEvents.length > 1 && (
                  <div className="flex justify-center gap-3 mt-6">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`transition-all duration-300 rounded-full ${
                          index === activeIndex
                            ? "w-12 h-3 bg-gradient-to-r from-[#6b2fa5] to-purple-600"
                            : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                        }`}
                        aria-label={`Go to event ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-2xl">
                <p className="text-gray-500 text-lg">No featured events available at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Themed Events Section */}
        <div>
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
            Themed Events
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {loadingThemed
              ? Array(8)
                  .fill(0)
                  .map((_, index) => <ThemedEventSkeleton key={index} />)
              : themedEvents.length > 0
              ? themedEvents.map((event) => (
                  <Link
                    href={`/event/${event.creatorID}/${event.eventId}`}
                    key={event.id}
                    className="group rounded-2xl overflow-hidden bg-white border-2 hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                    style={{
                      borderColor: event.themeColor || "#6b2fa5",
                    }}
                  >
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={event.imageURL || "/placeholder.svg"}
                        alt={event.eventName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      
                      {/* Theme Overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(45deg, ${event.themeColor || "#6b2fa5"}40, ${event.themeColor || "#6b2fa5"}20)`,
                        }}
                      />

                      {/* Theme Badge */}
                      <div className="absolute top-3 right-3">
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg"
                          style={{ backgroundColor: event.themeColor || "#6b2fa5" }}
                        >
                          <Palette className="w-3 h-3" />
                          <span>{event.theme}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-bold text-lg mb-3 text-gray-800 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {event.eventName}
                      </h4>

                      <div className="space-y-2 mb-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatShortDate(event.eventStartDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="line-clamp-1">{event.eventType}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            !event.freeOrPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {!event.freeOrPaid ? "Free" : "Paid"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              : Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
                    >
                      <p className="text-gray-400 text-sm">No events available</p>
                    </div>
                  ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              View All Events
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  )
}

export default Events