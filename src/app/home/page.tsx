"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import Head from "next/head"
import { auth, db } from "../lib/firebase"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { useRouter } from "next/navigation"
import UserHeader from "../../components/UserHeader"
import Footer from "../../components/footer"
import FetchWallet from "../../components/fetch-wallet"
import LoginButton from "../../components/LoginButton"
import "./home.css"

interface PublicEventType {
  eventName: string
  imageURL: string
  eventType: string
  venue: string
  eventStartDate: string
  freeOrPaid: boolean
  timestamp: any
  creatorID: string
  eventId: string
  eventGroup?: boolean
}

interface EventGroupData {
  eventName: string
  creatorID: string
  imageURL: string
  eventType?: string
}

interface SearchSuggestion {
  eventName: string
  creatorID: string
  eventId: string
}

// Network speed detection
const getNetworkSpeed = (): "slow" | "medium" | "fast" => {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (connection) {
    const effectiveType = connection.effectiveType
    if (effectiveType === "slow-2g" || effectiveType === "2g") return "slow"
    if (effectiveType === "3g") return "medium"
    return "fast"
  }

  // Fallback: detect based on device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  return isMobile ? "medium" : "fast"
}

// Image optimization function
const optimizeImageUrl = (originalUrl: string, width = 400): string => {
  if (!originalUrl || originalUrl.includes("/placeholder.svg")) {
    return originalUrl
  }

  const networkSpeed = getNetworkSpeed()

  // Quality settings based on network speed
  const qualityMap = {
    slow: 60,
    medium: 75,
    fast: 85,
  }

  // Width settings based on network speed
  const widthMap = {
    slow: Math.min(width, 300),
    medium: Math.min(width, 400),
    fast: width,
  }

  const quality = qualityMap[networkSpeed]
  const optimizedWidth = widthMap[networkSpeed]

  // For Firebase Storage URLs, add transformation parameters
  if (originalUrl.includes("firebasestorage.googleapis.com")) {
    const url = new URL(originalUrl)
    url.searchParams.set("w", optimizedWidth.toString())
    url.searchParams.set("q", quality.toString())
    url.searchParams.set("fm", "webp") // Use WebP format for better compression
    return url.toString()
  }

  // For other URLs, try to add Cloudinary-style parameters if possible
  if (originalUrl.includes("cloudinary.com")) {
    return originalUrl.replace("/upload/", `/upload/w_${optimizedWidth},q_${quality},f_auto/`)
  }

  // For other services, return original URL
  return originalUrl
}

// Lazy loading hook
const useLazyLoading = (ref: React.RefObject<HTMLElement | null>, threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const currentRef = ref.current

    if (!currentRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(currentRef)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold])

  return isVisible
}

// Lazy Image Component
const LazyImage: React.FC<{
  src: string
  alt: string
  className?: string
  width?: number
}> = ({ src, alt, className, width = 400 }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const isVisible = useLazyLoading(imgRef)

  const optimizedSrc = optimizeImageUrl(src, width)

  return (
    <div ref={imgRef} className={`lazy-image-container ${className || ""}`}>
      {isVisible && (
        <>
          {!isLoaded && !hasError && (
            <div className="image-placeholder">
              <div className="image-skeleton"></div>
            </div>
          )}
          <img
            src={optimizedSrc || "/placeholder.svg"}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true)
              setIsLoaded(true)
            }}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
          {hasError && (
            <div className="image-error">
              <span>Failed to load image</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Loading skeleton component for event cards
const EventCardSkeleton = () => (
  <div className="event-card-skeleton animate-pulse">
    <div className="skeleton-tag"></div>
    <div className="skeleton-date"></div>
    <div className="skeleton-image"></div>
    <div className="skeleton-title"></div>
    <div className="skeleton-type"></div>
    <div className="skeleton-venue"></div>
    <div className="skeleton-booker"></div>
  </div>
)

// Event Group Card Component
const EventGroupCard: React.FC<{
  eventGroup: EventGroupData
  onClick: () => void
}> = ({ eventGroup, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const isVisible = useLazyLoading(cardRef, 0.1)

  if (!isVisible) {
    return (
      <div ref={cardRef} className="event-card-placeholder">
        <EventCardSkeleton />
      </div>
    )
  }

  return (
    <div ref={cardRef} onClick={onClick} className="event-card event-group-card">
      <div className="event-card-image">
        <LazyImage src={eventGroup.imageURL || "/placeholder.svg"} alt={eventGroup.eventName || "Event"} width={400} />
        <div className="event-group-overlay">
          <span className="event-group-badge">Event Collection</span>
        </div>
      </div>

      <div className="event-card-content">
        <h2 className="event-title">{eventGroup.eventName || "Untitled Event"}</h2>
        <p className="event-type">{eventGroup.eventType || "Event Collection"}</p>
      </div>
    </div>
  )
}

// Lazy Event Card Component
const LazyEventCard: React.FC<{
  event: PublicEventType
  isPast?: boolean
  isToday?: boolean
  onClick: () => void
}> = ({ event, isPast = false, isToday = false, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const isVisible = useLazyLoading(cardRef, 0.1)

  if (!isVisible) {
    return (
      <div ref={cardRef} className="event-card-placeholder">
        <EventCardSkeleton />
      </div>
    )
  }

  return (
    <div ref={cardRef} onClick={onClick} className="event-card">
      <div className="event-card-header">
        <span className={`event-price-tag ${!event.freeOrPaid ? "free" : "paid"}`}>
          {!event.freeOrPaid ? "Free" : "Paid"}
        </span>

        <span className={`event-date-tag ${isPast ? "past" : ""} ${isToday ? "today" : ""}`}>
          {new Date(event.eventStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="event-card-image">
        <LazyImage src={event.imageURL || "/placeholder.svg"} alt={event.eventName} width={400} />
      </div>

      <div className="event-card-content">
        <h2 className="event-title">{event.eventName}</h2>
        <p className="event-type">{event.eventType}</p>
        <p className="event-venue">{event.venue}</p>
      </div>
    </div>
  )
}

const Home = () => {
  const [username, setUsername] = useState("")
  const [events, setEvents] = useState<PublicEventType[]>([])
  const [eventGroups, setEventGroups] = useState<EventGroupData[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventType[]>([])
  const [eventsToday, setEventsToday] = useState<PublicEventType[]>([])
  const [pastEvents, setPassedEvents] = useState<PublicEventType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [priceFilter, setPriceFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pageLoaded, setPageLoaded] = useState(false)
  const router = useRouter()

  // Cache key and duration
  const cacheKey = "home_public_events_data"
  const cacheDuration = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Format number with commas
  const formatNumber = useCallback((num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }, [])

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Check if event is happening today
  const isEventToday = (eventDate: string) => {
    const eventDay = new Date(eventDate).toISOString().split("T")[0]
    return eventDay === getTodayDate()
  }

  // Format today's date for display
  const formatTodayDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
      if (user) {
        const fetchUsername = async () => {
          const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)))
          if (!userDoc.empty) {
            setUsername(userDoc.docs[0].data().username)
          }
        }
        fetchUsername()
      }
    })
    return () => unsubscribe()
  }, [])

  const fetchFreshEvents = useCallback(async () => {
    try {
      // Fetch from publicEvents collection with limit for upcoming events
      const publicEventsQuery = query(
        collection(db, "publicEvents"),
        orderBy("timestamp", "desc"),
        limit(50), // Get more to filter properly
      )
      const eventsSnapshot = await getDocs(publicEventsQuery)

      const eventList: PublicEventType[] = []
      const eventGroupsList: EventGroupData[] = []

      eventsSnapshot.docs.forEach((doc) => {
        const event = doc.data() as PublicEventType

        // Check if this is an event group
        if (event.eventGroup === true) {
          eventGroupsList.push({
            eventName: event.eventName,
            creatorID: event.creatorID,
            imageURL: event.imageURL,
            eventType: event.eventType,
          })
        } else {
          eventList.push({
            ...event,
            eventId: event.eventId || doc.id, // Ensure eventId exists
          })
        }
      })

      setEventGroups(eventGroupsList)
      setEvents(eventList)

      const now = new Date()

      // Separate events by timing (use eventList instead of all events)
      const upcoming = eventList.filter((e) => {
        if (!e || !e.eventStartDate) return false
        const eventDate = new Date(e.eventStartDate)
        return eventDate >= now && !isEventToday(e.eventStartDate)
      })

      const todayEvents = eventList.filter((e) => {
        if (!e || !e.eventStartDate) return false
        return isEventToday(e.eventStartDate)
      })

      const past = eventList.filter((e) => {
        if (!e || !e.eventStartDate) return false
        const eventDate = new Date(e.eventStartDate)
        return eventDate < now && !isEventToday(e.eventStartDate)
      })

      // Sort and limit upcoming events to 10 most recent
      const sortedUpcoming = upcoming
        .sort((a, b) => new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime())
        .slice(0, 10)

      const sortedToday = todayEvents.sort(
        (a, b) => new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime(),
      )
      const sortedPast = past.sort(
        (a, b) => new Date(b.eventStartDate).getTime() - new Date(a.eventStartDate).getTime(),
      )

      setUpcomingEvents(sortedUpcoming)
      setEventsToday(sortedToday)
      setPassedEvents(sortedPast)

      // Cache the data with timestamp
      const cacheData = {
        events: eventList,
        eventGroups: eventGroupsList,
        upcoming: sortedUpcoming,
        today: sortedToday,
        past: sortedPast,
        timestamp: Date.now(),
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))

      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handlePageLoad = () => {
      setPageLoaded(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 1000) // Show preloader for at least 1 second
    }

    if (document.readyState === "complete") {
      handlePageLoad()
    } else {
      window.addEventListener("load", handlePageLoad)
      return () => window.removeEventListener("load", handlePageLoad)
    }
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      // Try to get from cache first
      const cachedDataString = sessionStorage.getItem(cacheKey)

      if (cachedDataString) {
        try {
          const cachedData = JSON.parse(cachedDataString)
          const now = Date.now()

          // Check if cache is still valid
          if (cachedData.timestamp && now - cachedData.timestamp < cacheDuration) {
            setEvents(cachedData.events || [])
            setEventGroups(cachedData.eventGroups || [])
            setUpcomingEvents(cachedData.upcoming || [])
            setEventsToday(cachedData.today || [])
            setPassedEvents(cachedData.past || [])
            setLoading(false)
            // Refresh in background after using cache
            fetchFreshEvents()
            return
          }
        } catch (error) {
          // Continue to fresh fetch
        }
      }

      // No valid cache, fetch fresh data
      const result = await fetchFreshEvents()
      if (!result) console.error("Failed to fetch events")
    }

    fetchEvents()
  }, [cacheDuration, fetchFreshEvents])

  // Handle search suggestions
  useEffect(() => {
    const fetchSearchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const searchLower = searchQuery.toLowerCase()
        const suggestions = events
          .filter((event) => event && event.eventName && event.eventName.toLowerCase().includes(searchLower))
          .slice(0, 5) // Limit to 5 suggestions
          .map((event) => ({
            eventName: event.eventName,
            creatorID: event.creatorID,
            eventId: event.eventId,
          }))

        setSearchSuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
      } catch (error) {
        // Handle error silently
      }
    }

    const debounceTimer = setTimeout(fetchSearchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, events])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery("")
    setShowSuggestions(false)
    router.push(`/event/${suggestion.creatorID}/${suggestion.eventId}`)
  }

  const navigateToEvent = (creatorId: string, eventId: string) => {
    router.push(`/event/${creatorId}/${eventId}`)
  }

  const navigateToEventGroup = (eventGroup: EventGroupData) => {
    router.push(`/event-group/${eventGroup.creatorID}/${encodeURIComponent(eventGroup.eventName)}`)
  }

  const filterEvents = (list: PublicEventType[]) => {
    return list.filter((event) => {
      if (!event) return false

      const matchesSearch = searchQuery
        ? (event.eventName && event.eventName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (event.eventId && event.eventId.toLowerCase().includes(searchQuery.toLowerCase()))
        : true

      const matchesType = filterType ? event.eventType === filterType : true
      const matchesPrice = priceFilter === "free" ? !event.freeOrPaid : priceFilter === "paid" ? event.freeOrPaid : true

      return matchesSearch && matchesType && matchesPrice
    })
  }

  const renderSkeletons = (count: number) =>
    Array(count)
      .fill(0)
      .map((_, index) => <EventCardSkeleton key={index} />)

  const filteredUpcomingEvents = filterEvents(upcomingEvents)
  const filteredTodayEvents = filterEvents(eventsToday)
  const filteredPastEvents = filterEvents(pastEvents)

  if (isLoading) {
    return (
      <div className="preloader-container">
        <div className="preloader-content">
          <img src="/preloader.gif" alt="Loading..." className="preloader-gif" />
        </div>
        <style jsx>{`
          .preloader-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }
          
          .preloader-content {
            text-align: center;
          }
          
          .preloader-gif {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Spotix Event Home</title>
        <meta
          name="description"
          content="Find, book, and attend the best events on your campus. Discover concerts, night parties, workshops, religious events, and more on Spotix."
        />
        {/* Open Graph for social media */}
        <meta property="og:title" content="Spotix | Discover and Book Campus Events" />
        <meta
          property="og:description"
          content="Explore top events in your school – concerts, workshops, parties & more. Powered by Spotix."
        />
        <meta property="og:image" content="/meta.png" />
        <meta property="og:url" content="https://spotix.com.ng" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spotix | Discover and Book Campus Events" />
        <meta
          name="twitter:description"
          content="Explore top events in your school – concerts, workshops, parties & more. Powered by Spotix."
        />
        <meta name="twitter:image" content="/meta.png" />
      </Head>

      <UserHeader />
      <div className="home-container">
        <div className="home-header">
          <h1>Welcome{isAuthenticated ? `, ${username}` : ""} to Spotix!</h1>
          {isAuthenticated ? <FetchWallet /> : <LoginButton />}
        </div>

        <div className="search-filter-container">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by Event Name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="search-bar"
            />
            {showSuggestions && (
              <div className="search-suggestions">
                {searchSuggestions.map((suggestion, index) => (
                  <div key={index} className="search-suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion.eventName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <select value={filterType || ""} onChange={(e) => setFilterType(e.target.value)} className="filter-dropdown">
            <option value="">All Types</option>
            <option value="Night party">Night Party</option>
            <option value="Concert">Concert</option>
            <option value="Religious">Religious</option>
            <option value="Conference">Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={priceFilter || ""}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="filter-dropdown"
          >
            <option value="">All Prices</option>
            <option value="free">Free Events</option>
            <option value="paid">Paid Events</option>
          </select>
        </div>

        {/* Today's Date Block */}
        <div className="today-date-block">
          <span className="today-label">Today:</span>
          <span className="today-date">{formatTodayDate()}</span>
        </div>

        {/* Events Today Section */}
        {eventsToday.length > 0 && (
          <>
            <h2 className="section-title events-today-title">Events Today</h2>
            <div className="events-grid">
              {loading ? (
                renderSkeletons(4)
              ) : filteredTodayEvents.length > 0 ? (
                filteredTodayEvents.map((event, index) => (
                  <LazyEventCard
                    key={event.eventId || `today-${index}`}
                    event={event}
                    isToday={true}
                    onClick={() => navigateToEvent(event.creatorID, event.eventId)}
                  />
                ))
              ) : (
                <p className="no-events-message">No events happening today match your filters.</p>
              )}
            </div>
          </>
        )}

        <h2 className="section-title">Upcoming Events</h2>
        <div className="events-grid">
          {loading ? (
            renderSkeletons(8)
          ) : filteredUpcomingEvents.length > 0 ? (
            filteredUpcomingEvents.map((event, index) => (
              <LazyEventCard
                key={event.eventId || `upcoming-${index}`}
                event={event}
                onClick={() => navigateToEvent(event.creatorID, event.eventId)}
              />
            ))
          ) : (
            <p className="no-events-message">No upcoming events found.</p>
          )}
        </div>

        {/* Event Groups Section */}
        {eventGroups.length > 0 && (
          <>
            <h2 className="section-title event-groups-title">Event Collections</h2>
            <div className="events-grid">
              {loading ? (
                renderSkeletons(4)
              ) : eventGroups.length > 0 ? (
                eventGroups.map((eventGroup, index) => (
                  <EventGroupCard
                    key={`group-${eventGroup.creatorID}-${eventGroup.eventName}-${index}`}
                    eventGroup={eventGroup}
                    onClick={() => navigateToEventGroup(eventGroup)}
                  />
                ))
              ) : (
                <p className="no-events-message">No event collections found.</p>
              )}
            </div>
          </>
        )}

        <h2 className="section-title past-events-title">Past Events</h2>
        <div className="events-grid">
          {loading ? (
            renderSkeletons(4)
          ) : filteredPastEvents.length > 0 ? (
            filteredPastEvents.map((event, index) => (
              <LazyEventCard
                key={event.eventId || `past-${index}`}
                event={event}
                isPast={true}
                onClick={() => navigateToEvent(event.creatorID, event.eventId)}
              />
            ))
          ) : (
            <p className="no-events-message">No past events found.</p>
          )}
        </div>
      </div>

      <Footer />

      {/* Additional styles for lazy loading and image optimization */}
      <style>{`
        .lazy-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          border-radius: 8px;
        }

        .lazy-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease-in-out;
        }

        .image-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
        }

        .image-skeleton {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        .image-error {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #666;
          font-size: 14px;
        }

        .event-card-placeholder {
          min-height: 350px;
        }

        @keyframes loading {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Ensure event tags are included in blur effect */
        .event-card .event-price-tag,
        .event-card .event-date-tag {
          position: relative;
          z-index: 1;
        }

        /* Performance optimizations */
        .events-grid {
          contain: layout style paint;
        }

        .event-card {
          contain: layout style paint;
          will-change: transform;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .lazy-image-container img,
          .image-skeleton {
            animation: none;
            transition: none;
          }
        }

        .event-group-card {
          position: relative;
        }

        .event-group-overlay {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
        }

        .event-group-badge {
          background: linear-gradient(135deg, #6b2fa5, #8b5cf6);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(107, 47, 165, 0.3);
        }

        .event-groups-title {
          background: linear-gradient(135deg, #6b2fa5, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        .event-groups-title::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(135deg, #6b2fa5, #8b5cf6);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}

export default Home
