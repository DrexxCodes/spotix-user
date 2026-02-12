"use client"

import React from "react"
import { Layers } from "lucide-react"

interface EventGroupData {
  eventName: string
  creatorID: string
  imageURL: string
  eventType?: string
}

interface EventCollectionsProps {
  eventGroups: EventGroupData[]
  loading: boolean
  onEventGroupClick: (eventGroup: EventGroupData) => void
}

// Lazy Image Component
const LazyImage: React.FC<{
  src: string
  alt: string
  className?: string
}> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  const getOptimizedImageUrl = (url: string): string => {
    if (!url) return "/placeholder.svg"
    if (url.includes("cloudinary.com")) {
      const uploadIndex = url.indexOf("/upload/")
      if (uploadIndex !== -1) {
        const beforeUpload = url.substring(0, uploadIndex + 8)
        const afterUpload = url.substring(uploadIndex + 8)
        return `${beforeUpload}c_fill,w_800,h_600,q_auto,f_auto/${afterUpload}`
      }
    }
    return url
  }

  return (
    <div className={`relative ${className || ""}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
      )}
      <img
        src={getOptimizedImageUrl(src)}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true)
          setIsLoaded(true)
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Failed to load
        </div>
      )}
    </div>
  )
}

// Event Group Card Skeleton
const EventGroupCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
)

// Event Group Card Component
const EventGroupCard: React.FC<{
  eventGroup: EventGroupData
  onClick: () => void
}> = ({ eventGroup, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-purple-400 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <LazyImage
          src={eventGroup.imageURL || "/placeholder.svg"}
          alt={eventGroup.eventName || "Event"}
          className="w-full h-full"
        />
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
            style={{ background: "#6b2fa5" }}
          >
            <Layers size={14} />
            Event Collection
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
          {eventGroup.eventName || "Untitled Event"}
        </h3>
        <p className="text-sm text-gray-600 font-medium">{eventGroup.eventType || "Event Collection"}</p>
      </div>
    </div>
  )
}

const EventCollections: React.FC<EventCollectionsProps> = ({ eventGroups, loading, onEventGroupClick }) => {
  if (eventGroups.length === 0 && !loading) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      {/* Styled Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold relative inline-block"
            style={{ color: "#6b2fa5" }}
          >
            <span className="relative z-10">Event Collections</span>
            <div
              className="absolute -bottom-1 left-0 w-full h-3 opacity-20 rounded-full"
              style={{ background: "#6b2fa5" }}
            ></div>
          </h2>
          <Layers size={28} className="text-purple-500" />
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          Explore curated event series and collections
        </p>
      </div>

      {/* Event Group Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <>
            <EventGroupCardSkeleton />
            <EventGroupCardSkeleton />
            <EventGroupCardSkeleton />
            <EventGroupCardSkeleton />
          </>
        ) : eventGroups.length > 0 ? (
          eventGroups.map((eventGroup, index) => (
            <EventGroupCard
              key={`group-${eventGroup.creatorID}-${eventGroup.eventName}-${index}`}
              eventGroup={eventGroup}
              onClick={() => onEventGroupClick(eventGroup)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No event collections found.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default EventCollections