"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { auth, db } from "../lib/firebase"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { useRouter } from "next/navigation"
import UserHeader from "../../components/UserHeader"
import Footer from "../../components/footer"
import ImageCarousels from "../../components/carousel"
import Preloader from "@/components/Preloader"
import Header from "./components/Header"
import SearchBar from "./components/SearchBar"
import Today from "./components/Today"
import TodayEvents from "./components/Todayevents"
import UpcomingEvents from "./components/UpcomingEvents"
import EventCollections from "./components/EventCollections"
import PastEvents from "./components/PastEvents"

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

const Home: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [showPreloader, setShowPreloader] = useState(true)
  
  // Events state
  const [eventsToday, setEventsToday] = useState<PublicEventType[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventType[]>([])
  const [pastEvents, setPastEvents] = useState<PublicEventType[]>([])
  const [eventGroups, setEventGroups] = useState<EventGroupData[]>([])
  const [allEvents, setAllEvents] = useState<PublicEventType[]>([])
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [priceFilter, setPriceFilter] = useState<string | null>(null)
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const router = useRouter()
  const hasActiveFilters = Boolean(searchQuery || filterType || priceFilter)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/v1/auth", {
          method: "GET",
          credentials: "include",
        })
        
        const data = await response.json()
        
        if (data.authenticated) {
          setIsAuthenticated(true)
          
          // Try to get username from localStorage first
          const storedUser = localStorage.getItem("spotix_user")
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            setUsername(userData.username || userData.fullName || "")
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      }
    }
    
    checkAuth()
  }, [])

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const publicEventsQuery = query(
          collection(db, "publicEvents"),
          orderBy("timestamp", "desc"),
          limit(100)
        )
        const publicEventsSnapshot = await getDocs(publicEventsQuery)

        const fetchedEvents: PublicEventType[] = []
        const fetchedEventGroups: EventGroupData[] = []

        publicEventsSnapshot.forEach((doc) => {
          const data = doc.data()
          
          // Check if it's an event group
          if (data.eventGroup === true) {
            fetchedEventGroups.push({
              eventName: data.eventName,
              creatorID: data.creatorID,
              imageURL: data.imageURL,
              eventType: data.eventType,
            })
          } else {
            // Only add non-event-group events to the events list
            fetchedEvents.push({
              eventName: data.eventName,
              imageURL: data.imageURL,
              eventType: data.eventType,
              venue: data.venue,
              eventStartDate: data.eventStartDate,
              freeOrPaid: data.freeOrPaid,
              timestamp: data.timestamp,
              creatorID: data.creatorID,
              eventId: data.eventId || doc.id,
              eventGroup: data.eventGroup,
            })
          }
        })

        setAllEvents(fetchedEvents)
        setEventGroups(fetchedEventGroups)

        // Categorize events based on current time
        const now = new Date()

        const getTodayDate = () => {
          const today = new Date()
          return today.toISOString().split("T")[0]
        }

        const isEventToday = (eventDate: string) => {
          const eventDay = new Date(eventDate).toISOString().split("T")[0]
          return eventDay === getTodayDate()
        }

        const todayEvents: PublicEventType[] = []
        const upcoming: PublicEventType[] = []
        const past: PublicEventType[] = []

        fetchedEvents.forEach((event) => {
          if (!event || !event.eventStartDate) return

          const eventDate = new Date(event.eventStartDate)

          if (isEventToday(event.eventStartDate)) {
            todayEvents.push(event)
          } else if (eventDate >= now) {
            upcoming.push(event)
          } else {
            past.push(event)
          }
        })

        // Sort the events
        const sortedUpcoming = upcoming.sort(
          (a, b) => new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime()
        )
        const sortedToday = todayEvents.sort(
          (a, b) => new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime()
        )
        const sortedPast = past.sort(
          (a, b) => new Date(b.eventStartDate).getTime() - new Date(a.eventStartDate).getTime()
        )

        setEventsToday(sortedToday)
        setUpcomingEvents(sortedUpcoming)
        setPastEvents(sortedPast)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Search suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const suggestions = allEvents
        .filter((event) =>
          event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.eventId.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
        .map((event) => ({
          eventName: event.eventName,
          creatorID: event.creatorID,
          eventId: event.eventId,
        }))
      
      setSearchSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, allEvents])

  // Filter events
  const filterEvents = useCallback((events: PublicEventType[]) => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const matchesSearch =
          event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.eventId.toLowerCase().includes(searchQuery.toLowerCase())
        if (!matchesSearch) return false
      }

      // Type filter
      if (filterType && event.eventType !== filterType) {
        return false
      }

      // Price filter
      if (priceFilter) {
        if (priceFilter === "free" && event.freeOrPaid) return false
        if (priceFilter === "paid" && !event.freeOrPaid) return false
      }

      return true
    })
  }, [searchQuery, filterType, priceFilter])

  const filteredTodayEvents = filterEvents(eventsToday)
  const filteredUpcomingEvents = filterEvents(upcomingEvents)
  const filteredPastEvents = filterEvents(pastEvents)

  // Navigation handlers
  const navigateToEvent = (creatorId: string, eventId: string) => {
    router.push(`/event/${creatorId}/${eventId}`)
  }

  const navigateToEventGroup = (eventGroup: EventGroupData) => {
    router.push(`/event/${eventGroup.creatorID}/${eventGroup.eventName}`)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.eventName)
    setShowSuggestions(false)
    navigateToEvent(suggestion.creatorID, suggestion.eventId)
  }

  // Format today's date
  const formatTodayDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Handle preloader completion
  const handlePreloaderComplete = () => {
    setShowPreloader(false)
  }

  if (showPreloader) {
    return <Preloader onLoadingComplete={handlePreloaderComplete} minDisplayTime={3000} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <UserHeader />

      <main className="w-full">
        {/* Header Section */}
        <Header isAuthenticated={isAuthenticated} username={username} />

        {/* Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchSuggestions={searchSuggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          filterType={filterType}
          setFilterType={setFilterType}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          hasActiveFilters={hasActiveFilters}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Image Carousel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <ImageCarousels />
        </div>

        {/* Today's Date */}
        <Today todayDate={formatTodayDate()} />

        {/* Events Today */}
        <TodayEvents
          events={filteredTodayEvents}
          loading={loading}
          onEventClick={navigateToEvent}
        />

        {/* Upcoming Events */}
        <UpcomingEvents
          events={filteredUpcomingEvents}
          loading={loading}
          onEventClick={navigateToEvent}
        />

        {/* Event Collections */}
        <EventCollections
          eventGroups={eventGroups}
          loading={loading}
          onEventGroupClick={navigateToEventGroup}
        />

        {/* Past Events */}
        <PastEvents
          events={filteredPastEvents}
          loading={loading}
          onEventClick={navigateToEvent}
        />
      </main>

      <Footer />
    </div>
  )
}

export default Home