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
import { Calendar, MapPin, Clock, Search, Filter, X } from "lucide-react"

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

const EventCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
)

// Utility function to transform Cloudinary URLs
const getOptimizedImageUrl = (url: string, width = 800, height = 600): string => {
  if (!url) return "/placeholder.svg"
  
  // Check if it's a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    // Extract the upload part and everything after it
    const uploadIndex = url.indexOf('/upload/')
    if (uploadIndex !== -1) {
      const beforeUpload = url.substring(0, uploadIndex + 8) // includes '/upload/'
      const afterUpload = url.substring(uploadIndex + 8)
      
      // Add transformations: crop to fill, set dimensions, quality auto, format auto
      const transformations = `c_fill,w_${width},h_${height},q_auto,f_auto`
      return `${beforeUpload}${transformations}/${afterUpload}`
    }
  }
  
  return url
}

const LazyImage: React.FC<{ 
  src: string
  alt: string
  width?: number
  height?: number
  className?: string 
}> = ({ src, alt, width = 800, height = 600, className }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const optimizedSrc = getOptimizedImageUrl(src, width, height)

  return (
    <div className={`relative ${className || ""}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
      )}
      <img
        src={optimizedSrc}
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

const EventGroupCard: React.FC<{ eventGroup: EventGroupData; onClick: () => void }> = ({ eventGroup, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <LazyImage 
          src={eventGroup.imageURL || "/placeholder.svg"} 
          alt={eventGroup.eventName || "Event"}
          width={800}
          height={600}
          className="w-full h-full"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg" style={{ background: '#6b2fa5' }}>
            Event Collection
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">
          {eventGroup.eventName || "Untitled Event"}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{eventGroup.eventType || "Event Collection"}</p>
      </div>
    </div>
  )
}

const LazyEventCard: React.FC<{
  event: PublicEventType
  isPast?: boolean
  isToday?: boolean
  onClick: () => void
}> = ({ event, isPast = false, isToday = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <LazyImage 
          src={event.imageURL || "/placeholder.svg"} 
          alt={event.eventName}
          width={800}
          height={600}
          className="w-full h-full"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${!event.freeOrPaid ? 'bg-green-500' : 'bg-blue-500'}`}>
            {!event.freeOrPaid ? "Free" : "Paid"}
          </span>
          {isToday && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow-lg animate-pulse">
              Today
            </span>
          )}
          {isPast && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white shadow-lg">
              Past
            </span>
          )}
        </div>

        {/* Date Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-white rounded-lg shadow-lg p-2 text-center min-w-[60px]">
            <div className="text-xs font-semibold uppercase" style={{ color: '#6b2fa5' }}>
              {new Date(event.eventStartDate).toLocaleDateString("en-US", { month: "short" })}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {new Date(event.eventStartDate).getDate()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
          {event.eventName}
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f3e8ff' }}>
              <Calendar size={12} style={{ color: '#6b2fa5' }} />
            </div>
            <span className="truncate">{event.eventType}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f3e8ff' }}>
              <MapPin size={12} style={{ color: '#6b2fa5' }} />
            </div>
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
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
  const router = useRouter()

  const cacheKey = "home_public_events_data"
  const cacheDuration = 5 * 60 * 1000

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const isEventToday = (eventDate: string) => {
    const eventDay = new Date(eventDate).toISOString().split("T")[0]
    return eventDay === getTodayDate()
  }

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
      const publicEventsQuery = query(
        collection(db, "publicEvents"),
        orderBy("timestamp", "desc"),
        limit(50),
      )
      const eventsSnapshot = await getDocs(publicEventsQuery)

      const eventList: PublicEventType[] = []
      const eventGroupsList: EventGroupData[] = []

      eventsSnapshot.docs.forEach((doc) => {
        const event = doc.data() as PublicEventType

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
            eventId: event.eventId || doc.id,
          })
        }
      })

      setEventGroups(eventGroupsList)
      setEvents(eventList)

      const now = new Date()

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
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
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
      const cachedDataString = sessionStorage.getItem(cacheKey)

      if (cachedDataString) {
        try {
          const cachedData = JSON.parse(cachedDataString)
          const now = Date.now()

          if (cachedData.timestamp && now - cachedData.timestamp < cacheDuration) {
            setEvents(cachedData.events || [])
            setEventGroups(cachedData.eventGroups || [])
            setUpcomingEvents(cachedData.upcoming || [])
            setEventsToday(cachedData.today || [])
            setPassedEvents(cachedData.past || [])
            setLoading(false)
            fetchFreshEvents()
            return
          }
        } catch (error) {
          // Continue to fresh fetch
        }
      }

      const result = await fetchFreshEvents()
      if (!result) console.error("Failed to fetch events")
    }

    fetchEvents()
  }, [cacheDuration, fetchFreshEvents])

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
          .slice(0, 5)
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

  const hasActiveFilters = filterType || priceFilter

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <img src="/preloader.gif" alt="Loading..." className="w-20 h-20 object-contain" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Head>
        <title>Spotix Event Home</title>
        <meta name="description" content="Find, book, and attend the best events. Discover concerts, night parties, workshops, religious events, and more on Spotix." />
        <meta property="og:title" content="Spotix | Discover and Book Events" />
        <meta property="og:description" content="Explore top events – concerts, workshops, parties & more. Powered by Spotix." />
        <meta property="og:image" content="/meta.png" />
        <meta property="og:url" content="https://spotix.com.ng" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spotix | Discover and Book Events" />
        <meta name="twitter:description" content="Explore top events – concerts, workshops, parties & more. Powered by Spotix." />
        <meta name="twitter:image" content="/meta.png" />
      </Head>

      <UserHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Welcome{isAuthenticated ? `, ${username}` : ""} to Spotix!
              </h1>
              <p className="text-lg text-gray-600 mb-6">Discover and book amazing events happening around you</p>
              {isAuthenticated ? <FetchWallet /> : <LoginButton />}
            </div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search events by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10">
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{suggestion.eventName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Type Filter */}
                  <select
                    value={filterType || ""}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="Night party">Night Party</option>
                    <option value="Concert">Concert</option>
                    <option value="Religious">Religious</option>
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Other">Other</option>
                  </select>

                  {/* Price Filter */}
                  <select
                    value={priceFilter || ""}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Prices</option>
                    <option value="free">Free Events</option>
                    <option value="paid">Paid Events</option>
                  </select>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {filterType && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {filterType}
                        <button onClick={() => setFilterType(null)} className="hover:bg-purple-200 rounded-full p-0.5">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {priceFilter && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {priceFilter === "free" ? "Free" : "Paid"}
                        <button onClick={() => setPriceFilter(null)} className="hover:bg-purple-200 rounded-full p-0.5">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Today's Date */}
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#6b2fa5' }}>
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-lg font-bold text-gray-900">{formatTodayDate()}</p>
              </div>
            </div>
          </div>

          {/* Events Today */}
          {eventsToday.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Events Today</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-500 text-white animate-pulse">
                  Live
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No events happening today match your filters.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No upcoming events found.</p>
                </div>
              )}
            </div>
          </section>

          {/* Event Collections */}
          {eventGroups.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#6b2fa5' }}>Event Collections</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No event collections found.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Past Events */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Past Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No past events found.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Home