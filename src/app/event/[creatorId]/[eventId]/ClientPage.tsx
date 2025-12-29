"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db, auth } from "../../../lib/firebase"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import { ArrowLeft, Ticket, X, Wallet, Maximize2, AlertCircle } from "lucide-react"
import LoginButton from "@/components/LoginButton"
import EventDetailsSection from "./event-details-section"
import LocationSection from "./location-section"
import ReviewsSection from "./reviews-section"
import BookerDetailsSection from "./booker-details-section"
import BuyTicketDialog from "./buy-ticket-dialog"
import MerchSection from "./merch-section"
import { formatNumber } from "@/utils/formatter"
import { ReportModal } from "./report-modal"

interface EventType {
  id: string
  eventName: string
  eventImage: string
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

const LazyImage: React.FC<{
  src: string
  alt: string
  className?: string
  eventName?: string
  useProxy?: boolean
  showFullscreenIcon?: boolean
}> = ({ src, alt, className, eventName, useProxy = false, showFullscreenIcon = false }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

const getImageSrc = () => {
  if (!useProxy || !src || src.includes("/placeholder.svg")) {
    return src || "/placeholder.svg"
  }

  const encodedUrl = encodeURIComponent(src)
  const encodedName = eventName ? encodeURIComponent(eventName) : ""
  return `/api/image-proxy/event-image?url=${encodedUrl}&name=${encodedName}`
}

  return (
    <>
      <div ref={imgRef} className={`relative group ${className || ""}`}>
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        )}
        <img
          src={getImageSrc() || "/placeholder.svg"}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true)
            setIsLoaded(true)
          }}
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {showFullscreenIcon && isLoaded && !hasError && (
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
          >
            <Maximize2 size={20} />
          </button>
        )}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Failed to load image</span>
          </div>
        )}
      </div>

      {showFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute -top-2 -right-2 sm:top-4 sm:right-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full transition-all duration-200 z-20 shadow-lg border-2 border-white/20"
            >
              <X size={24} />
            </button>
            <img
              src={getImageSrc() || "/placeholder.svg"}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}

// Loading skeleton component
const EventSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-32 bg-gray-200 rounded-md"></div>
      </div>
      <div className="h-64 w-full bg-gray-200 rounded-md mb-4"></div>
      <div className="space-y-4 p-4">
        <div className="h-8 w-3/4 bg-gray-200 rounded-md"></div>
        <div className="h-32 w-full bg-gray-200 rounded-md"></div>
      </div>
    </div>
  </div>
)

// Preloader component
const Preloader = () => (
  <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div className="text-center">
      <img src="/preloader.gif" alt="Loading..." className="w-24 h-24 mx-auto mb-4" />
      <p className="text-purple-600 font-medium">Loading event details...</p>
    </div>
  </div>
)

export default function ClientPage({
  params,
}: {
  params: {
    creatorId: string
    eventId: string
  }
}) {
  const { creatorId, eventId } = params
  const router = useRouter()

  const [eventData, setEventData] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [isSoldOut, setIsSoldOut] = useState(false)
  const [isSaleEnded, setIsSaleEnded] = useState(false)
  const [isEventPassed, setIsEventPassed] = useState(false)
  const [isEventToday, setIsEventToday] = useState(false)
  const [bookerDetails, setBookerDetails] = useState<{
    username: string
    email: string
    phone: string
    isVerified: boolean
  } | null>(null)
  const [eventUrl, setEventUrl] = useState<string>("")
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [showPassedDialog, setShowPassedDialog] = useState(false)
  const [showBuyTicketDialog, setShowBuyTicketDialog] = useState(false)
  const [username, setUsername] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [buttonPosition, setButtonPosition] = useState<"bottom" | "static" | "top">("bottom")
  const bookerDetailsRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [showReportModal, setShowReportModal] = useState(false)

  // Use sessionStorage for caching
  const cacheKey = `event_${eventId}_${creatorId}`
  const cacheDuration = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Check if event has ended
  const hasEventEnded = useCallback(() => {
    if (!eventData?.eventEndDate) return false

    const now = new Date()
    const endDate = new Date(eventData.eventEndDate)

    // If there's an end time, add it to the end date
    if (eventData.eventEnd) {
      const [hours, minutes] = eventData.eventEnd.split(":").map(Number)
      endDate.setHours(hours || 0, minutes || 0)
    }

    return now > endDate
  }, [eventData])

  useEffect(() => {
    // Check authentication status
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)

      if (user) {
        const fetchUserData = async () => {
          try {
            const idToken = await user.getIdToken()

            const walletResponse = await fetch("/api/wallet", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
            })

            if (walletResponse.ok) {
              const walletData = await walletResponse.json()
              if (!walletData.error) {
                setWalletBalance(walletData.balance || 0)
              }
            }

            // Fetch user data for username
            const userDocRef = doc(db, "users", user.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
              const userData = userDoc.data()
              setUsername(userData.username || userData.fullName || "User")
            }
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        }
        fetchUserData()
      }
    })

    // Set the event URL for sharing
    setEventUrl(window.location.href)

    return () => unsubscribe()
  }, [])

  const checkEventStatus = useCallback((data: EventType) => {
    const now = new Date()
    const eventDate = new Date(data.eventDate)

    // Check if event is happening today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDateOnly = new Date(eventDate)
    eventDateOnly.setHours(0, 0, 0, 0)
    const isToday = today.getTime() === eventDateOnly.getTime()
    setIsEventToday(isToday)

    // Check if event is sold out
    if (data.enableMaxSize && data.maxSize && data.ticketsSold) {
      if (Number.parseInt(data.maxSize) <= data.ticketsSold) {
        setIsSoldOut(true)
      }
    }

    // Check if sales have ended
    if (data.enableStopDate && data.stopDate) {
      const stopDate = new Date(data.stopDate)
      if (now > stopDate) {
        setIsSaleEnded(true)
      }
    } else {
      // If no stop date specified, allow sales until 11:59pm of event date
      const salesEndTime = new Date(eventDate)
      salesEndTime.setHours(23, 59, 59, 999)
      if (now > salesEndTime) {
        setIsSaleEnded(true)
      }
    }

    // Check if event date has passed (but not if it's today)
    if (!isToday && now > eventDate) {
      setIsEventPassed(true)
    }
  }, [])

  const checkLikeStatus = useCallback((data: EventType) => {
    const user = auth.currentUser
    if (!user) return

    // Check if user has liked this event
    const userLiked = data.likedBy?.includes(user.uid) || false
    setIsLiked(userLiked)

    // Set like count
    setLikeCount(data.likes || 0)
  }, [])

  const fetchBookerDetails = useCallback(async (creatorId: string, bookerName: string) => {
    try {
      const bookerDocRef = doc(db, "users", creatorId)
      const bookerDoc = await getDoc(bookerDocRef)

      if (bookerDoc.exists()) {
        const bookerData = bookerDoc.data()
        setBookerDetails({
          username: bookerName || bookerData.username || "Unknown",
          email: bookerData.email || "Not provided",
          phone: bookerData.phoneNumber || "Not provided",
          isVerified: bookerData.isVerified || false,
        })
      }
    } catch (error) {
      console.error("Error fetching booker details:", error)
    }
  }, [])

  const fetchFreshData = useCallback(async () => {
    try {
      if (!creatorId || !eventId) {
        setEventData(null)
        setLoading(false)
        return
      }

      const docRef = doc(db, "events", creatorId, "userEvents", eventId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as EventType
        const eventWithId = { ...data, id: docSnap.id }

        // Cache the data with timestamp
        const cacheData = {
          data: eventWithId,
          timestamp: Date.now(),
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))

        setEventData(eventWithId)

        // Check event status
        checkEventStatus(eventWithId)

        // Check if current user has liked this event
        checkLikeStatus(eventWithId)

        // Fetch booker details
        await fetchBookerDetails(eventWithId.createdBy, eventWithId.bookerName)
      } else {
        setEventData(null)
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }, [creatorId, eventId, cacheKey, checkEventStatus, checkLikeStatus, fetchBookerDetails])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true)
    }, 1500) // Show preloader for at least 1.5 seconds

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !creatorId) {
        setLoading(false)
        return
      }

      // Try to get from cache first
      const cachedDataString = sessionStorage.getItem(cacheKey)

      if (cachedDataString) {
        try {
          const cachedData = JSON.parse(cachedDataString)
          const now = Date.now()

          // Check if cache is still valid
          if (cachedData.timestamp && now - cachedData.timestamp < cacheDuration) {
            setEventData(cachedData.data)
            checkEventStatus(cachedData.data)
            checkLikeStatus(cachedData.data)
            await fetchBookerDetails(cachedData.data.createdBy, cachedData.data.bookerName)
            setLoading(false)

            // Refresh in background after using cache
            fetchFreshData()
            return
          }
        } catch (error) {
          console.error("Error parsing cached data:", error)
        }
      }

      // No valid cache, fetch fresh data
      fetchFreshData()
    }

    fetchEvent()
  }, [
    eventId,
    creatorId,
    cacheKey,
    cacheDuration,
    checkEventStatus,
    checkLikeStatus,
    fetchBookerDetails,
    fetchFreshData,
  ])

  const handleToggleLike = async () => {
    try {
      const user = auth.currentUser
      if (!user || !eventData) {
        // Redirect to login if user is not authenticated
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
        router.push("/auth/login")
        return
      }

      setIsLiking(true)

      const eventDocRef = doc(db, "events", creatorId as string, "userEvents", eventId as string)

      if (isLiked) {
        // Unlike event
        await updateDoc(eventDocRef, {
          likes: (likeCount || 0) - 1,
          likedBy: arrayRemove(user.uid),
        })
        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        // Like event
        await updateDoc(eventDocRef, {
          likes: (likeCount || 0) + 1,
          likedBy: arrayUnion(user.uid),
        })
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }

      // Update cache with new like status
      const cachedDataString = sessionStorage.getItem(cacheKey)
      if (cachedDataString) {
        try {
          const cachedData = JSON.parse(cachedDataString)
          const updatedEventData = {
            ...cachedData.data,
            likes: isLiked ? (cachedData.data.likes || 0) - 1 : (cachedData.data.likes || 0) + 1,
            likedBy: isLiked
              ? (cachedData.data.likedBy || []).filter((id: string) => id !== user.uid)
              : [...(cachedData.data.likedBy || []), user.uid],
          }

          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: updatedEventData,
              timestamp: cachedData.timestamp,
            }),
          )
        } catch (error) {
          console.error("Error updating cached data:", error)
        }
      }
    } catch (error) {
      console.error("Error toggling like status:", error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleBuyTicket = (ticketType: string, ticketPrice: number | string) => {
    if (!eventData) return

    if (isEventPassed) {
      setShowPassedDialog(true)
      return
    }

    if (isSoldOut) {
      alert("Sorry, this event is sold out!")
      return
    }

    if (isSaleEnded) {
      alert("Sorry, ticket sales have ended for this event!")
      return
    }

    // Check if user is authenticated
    if (!auth.currentUser) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      router.push("/auth/login")
      return
    }

    // Ensure price is a number
    const parsedPrice = typeof ticketPrice === "string" ? Number.parseFloat(ticketPrice) : ticketPrice

    const paymentData = {
      eventId: eventId,
      eventName: eventData.eventName,
      ticketType,
      ticketPrice: parsedPrice,
      eventCreatorId: creatorId,
      originalPrice: parsedPrice,
      discountApplied: false,
      discountCode: null,
      eventVenue: eventData.eventVenue,
      eventType: eventData.eventType,
      eventDate: eventData.eventDate,
      eventEndDate: eventData.eventEndDate,
      eventStart: eventData.eventStart,
      eventEnd: eventData.eventEnd,
      stopDate: eventData.stopDate,
      enableStopDate: eventData.enableStopDate,
      bookerName: eventData.bookerName,
      bookerEmail: eventData.bookerEmail,
      transactionFee: parsedPrice === 0 ? 0 : 150,
      totalAmount: parsedPrice === 0 ? 0 : parsedPrice + 150,
    }

    sessionStorage.setItem("spotix_payment_data", JSON.stringify(paymentData))
    console.log("[v0] Payment data stored:", paymentData)

    // Navigate to payment page
    router.push("/payment")
  }

  const handleBackClick = () => {
    router.push("/home")
  }

  const handleClosePassedDialog = () => {
    setShowPassedDialog(false)
  }

  const handleShowPassedDialog = () => {
    setShowPassedDialog(true)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!bookerDetailsRef.current || !footerRef.current) return

      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      const bookerDetailsRect = bookerDetailsRef.current.getBoundingClientRect()
      const footerRect = footerRef.current.getBoundingClientRect()

      // If user scrolled past booker details section
      if (bookerDetailsRect.bottom < windowHeight) {
        // If footer is visible, snap button to top
        if (footerRect.top < windowHeight) {
          setButtonPosition("top")
        } else {
          // Button should be static between booker details and footer
          setButtonPosition("static")
        }
      } else {
        // Default fixed position at bottom
        setButtonPosition("bottom")
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial position

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isPageLoaded) {
    return <Preloader />
  }

  if (loading) {
    return (
      <>
        <UserHeader />
        <EventSkeleton />
        <Footer />
      </>
    )
  }

  if (!eventData) {
    return (
      <>
        <UserHeader />
        <div className="max-w-4xl mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Event not found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBackClick}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
        <Footer />
      </>
    )
  }

  // Apply event color if set
  const eventStyle = eventData.enableColorCode && eventData.colorCode ? { borderColor: eventData.colorCode } : {}

  const eventDescription = eventData.eventDescription
    ? eventData.eventDescription.substring(0, 160)
    : `Join us for ${eventData.eventName} on ${new Date(eventData.eventDate).toLocaleDateString()}. ${eventData.isFree ? "Free event" : "Tickets available now"}!`

  return (
    <>
      <UserHeader />

      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto p-4" style={eventStyle}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
              onClick={handleBackClick}
            >
              <ArrowLeft size={24} />
              <span className="font-medium">Back to Events</span>
            </button>

            <div className="flex items-center gap-4">
              {/* Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors border-2 border-red-200"
                title="Report this event"
              >
                <AlertCircle size={18} />
                <span className="hidden sm:inline">Report</span>
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 px-3 py-1.5 rounded-lg shadow-md">
                  <Wallet size={16} className="text-white" />
                  <span className="text-white font-medium">Balance:</span>
                  <span className="text-white font-bold">₦{formatNumber(walletBalance)}</span>
                </div>
              ) : (
                <LoginButton />
              )}
            </div>
          </div>

          {/* Scrolling Marquee */}
          <div className="bg-purple-600 text-white py-2 mb-6 rounded-lg overflow-hidden">
            <div className="animate-marquee-smooth whitespace-nowrap">
              <span className="text-sm font-medium px-4 inline-block">
                🎉 Grab your tickets for this event today! Events block color will change in response to the color code
                of event set by booker. Got any report about this event⛔? Use Spotix Telegram Bot to make reports
              </span>
              <span className="text-sm font-medium px-4 inline-block">
                🎉 Grab your tickets for this event today! Events block color will change in response to the color code
                of event set by booker. Got any report about this event⛔? Use Spotix Telegram Bot to make reports
              </span>
            </div>
          </div>

          {/* Event Status Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {isEventToday && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                🔥 Happening Today!
              </span>
            )}
            {isSoldOut && (
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">❌ Sold Out</span>
            )}
            {isSaleEnded && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                ⏰ Sales Ended
              </span>
            )}
            {isEventPassed && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                📅 Event Passed
              </span>
            )}
          </div>

          {/* Event Image */}
          <div className="w-full h-64 md:h-80 mb-8 rounded-lg overflow-hidden shadow-lg">
            <LazyImage
              src={eventData.eventImage || "/placeholder.svg"}
              alt={eventData.eventName}
              className="w-full h-full"
              eventName={eventData.eventName}
              useProxy={true}
              showFullscreenIcon={true}
            />
          </div>

          {/* Event Details Section */}
          <EventDetailsSection
            eventData={eventData}
            eventUrl={eventUrl}
            isLiked={isLiked}
            likeCount={likeCount}
            isLiking={isLiking}
            isSoldOut={isSoldOut}
            onToggleLike={handleToggleLike}
          />

          {/* Location Section */}
          <LocationSection eventVenue={eventData.eventVenue} eventName={eventData.eventName} />

          {/* Merch Section */}
          <MerchSection eventId={eventId || ""} creatorId={creatorId || ""} />

          {/* Reviews Section */}
          <ReviewsSection
            eventId={eventId || ""}
            eventName={eventData.eventName}
            eventEndDate={eventData.eventEndDate}
            eventEnd={eventData.eventEnd}
            hasEventEnded={hasEventEnded()}
            isAuthenticated={isAuthenticated}
          />

          {/* Booker Details Section */}
          <div ref={bookerDetailsRef}>
            <BookerDetailsSection
              bookerDetails={bookerDetails}
              bookerName={eventData.bookerName}
              creatorId={eventData.createdBy}
            />
          </div>
        </div>

        {/* Fixed Buy Ticket Button */}
        <div
          className={`
            ${buttonPosition === "bottom" ? "fixed bottom-0 left-0 right-0" : ""}
            ${buttonPosition === "top" ? "fixed top-16 left-0 right-0" : ""}
            ${buttonPosition === "static" ? "relative" : ""}
            bg-white border-t border-gray-200 p-4 shadow-lg z-50 transition-all duration-300
          `}
        >
          <div className="max-w-4xl mx-auto">
            {isEventPassed ? (
              <button
                onClick={handleShowPassedDialog}
                className="w-full bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold text-lg cursor-not-allowed"
                disabled
              >
                Event Has Passed
              </button>
            ) : isSoldOut ? (
              <button
                className="w-full bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold text-lg cursor-not-allowed"
                disabled
              >
                Sold Out
              </button>
            ) : isSaleEnded ? (
              <button
                className="w-full bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold text-lg cursor-not-allowed"
                disabled
              >
                Sales Ended
              </button>
            ) : (
              <button
                onClick={() => setShowBuyTicketDialog(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <Ticket size={20} />
                  {eventData.isFree ? "Register" : "Buy Tickets"}
                  {isEventToday && <span className="animate-pulse">🔥</span>}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Buy Ticket Dialog */}
        {showBuyTicketDialog && (
          <BuyTicketDialog
            eventData={eventData}
            isEventToday={isEventToday}
            isEventPassed={isEventPassed}
            isSoldOut={isSoldOut}
            isSaleEnded={isSaleEnded}
            onBuyTicket={handleBuyTicket}
            onClose={() => setShowBuyTicketDialog(false)}
            onShowPassedDialog={handleShowPassedDialog}
          />
        )}

        {/* Passed Event Dialog */}
        {showPassedDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Event Has Passed</h3>
                <button onClick={handleClosePassedDialog} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Dear {isAuthenticated ? username : "Guest"}, this event has already occurred; you can no longer purchase
                tickets. Please check out other events on our platform.
              </p>
              <button
                onClick={() => router.push("/home")}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Events
              </button>
            </div>
          </div>
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          eventId={eventId || ""}
          creatorId={creatorId || ""}
          eventName={eventData.eventName}
        />
      </div>

      <div ref={footerRef}>
        <Footer />
      </div>

      <style jsx>{`
        @keyframes marquee-smooth {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-smooth {
          animation: marquee-smooth 30s linear infinite;
        }
      `}</style>
    </>
  )
}
