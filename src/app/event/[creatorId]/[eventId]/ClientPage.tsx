"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db, auth } from "../../../lib/firebase"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import { ArrowLeft, Ticket, X, Wallet, Maximize2, AlertCircle, Flag } from "lucide-react"
import LoginButton from "@/components/LoginButton"
import EventDetailsSection from "./event-details-section"
import LocationSection from "./location-section"
import ReviewsSection from "./reviews-section"
import BookerDetailsSection from "./booker-details-section"
import BuyTicketDialog from "./buy-ticket-dialog"
import MerchSection from "./merch-section"
import { formatNumber } from "@/utils/formatter"
import { ReportModal } from "./report-modal"
import { ImageCarousel } from "./image-carousel"
import ImageCarousels from "@/components/carousel"

interface EventType {
  id: string
  eventName: string
  eventImage: string
  eventImages: string[]
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

interface ClientPageProps {
  params: {
    creatorId: string
    eventId: string
  }
  initialEventData?: EventType | null
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
    return src || "/placeholder.svg"
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
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full transition-all duration-200 hover:bg-opacity-70 hover:scale-110"
            aria-label="View fullscreen"
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
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-1/2 -translate-y-1/2 right-4 bg-white hover:bg-gray-100 text-gray-900 p-4 rounded-full transition-all duration-200 shadow-2xl border-2 border-gray-200"
            style={{ zIndex: 9999 }}
            aria-label="Close fullscreen"
          >
            <X size={28} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
            <img
              src={getImageSrc() || "/placeholder.svg"}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}

// Loading skeleton component
const EventSkeleton = () => (
  <div className="max-w-7xl mx-auto p-4">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-32 bg-gray-200 rounded-md"></div>
      </div>
      
      {/* Desktop Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-64 w-full bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-6">
          <div className="h-64 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-48 w-full bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
)

// Preloader component
const Preloader = () => (
  <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div className="text-center">
      <img src="/preloader.gif" alt="Loading..." className="w-24 h-24 mx-auto mb-4" />
      <p className="text-[#6b2fa5] font-medium">Loading event details...</p>
    </div>
  </div>
)

export default function ClientPage({ params, initialEventData }: ClientPageProps) {
  const { creatorId, eventId } = params
  const router = useRouter()

  const [eventData, setEventData] = useState<EventType | null>(initialEventData || null)
  const [loading, setLoading] = useState(!initialEventData)
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
  const [buttonPosition, setButtonPosition] = useState<"bottom" | "top">("bottom")
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

  // Fetch Event Data using API
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Check cache first
        const cachedData = sessionStorage.getItem(cacheKey)
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData)
          if (Date.now() - timestamp < cacheDuration) {
            setEventData(data)
            setLikeCount(data.likes || 0)
            setLoading(false)
            return
          }
        }

        // Fetch from API
        const response = await fetch(`/api/v1/event?creatorId=${creatorId}&eventId=${eventId}`)
        
        if (!response.ok) {
          router.push("/404")
          return
        }

        const result = await response.json()
        
        if (!result.success) {
          router.push("/404")
          return
        }

        const data = result.data as EventType
        setEventData(data)
        setLikeCount(data.likes || 0)

        // Cache the data
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          }),
        )

        // Check if current user has liked the event
        const currentUser = auth.currentUser
        if (currentUser && data.likedBy?.includes(currentUser.uid)) {
          setIsLiked(true)
        }
      } catch (error) {
        console.error("Error fetching event data:", error)
        router.push("/404")
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we don't have initial data
    if (!initialEventData) {
      fetchEventData()
    } else {
      // Set like status for initial data
      const currentUser = auth.currentUser
      if (currentUser && initialEventData.likedBy?.includes(currentUser.uid)) {
        setIsLiked(true)
      }
      setLikeCount(initialEventData.likes || 0)
    }
  }, [creatorId, eventId, router, cacheKey, cacheDuration, initialEventData])

  // Fetch booker details using API
  useEffect(() => {
    if (!eventData?.createdBy) return

    const fetchBookerDetails = async () => {
      try {
        const response = await fetch(`/api/v1/event/creator?creatorId=${eventData.createdBy}`)
        
        if (!response.ok) {
          console.error("Failed to fetch booker details")
          return
        }

        const result = await response.json()
        
        if (result.success) {
          setBookerDetails(result.data)
        }
      } catch (error) {
        console.error("Error fetching booker details:", error)
      }
    }

    fetchBookerDetails()
  }, [eventData?.createdBy])

  // Prevent body scroll when buy ticket dialog is open
  useEffect(() => {
    if (showBuyTicketDialog) {
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
    } else {
      // Re-enable scrolling
      document.body.style.overflow = 'unset'
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showBuyTicketDialog])

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true)
        try {
          // Fetch user data from API (you may want to create an API endpoint for this too)
          const userDocRef = doc(db, "users", user.uid)
          const { getDoc } = await import("firebase/firestore")
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUsername(userData.username || "User")
            setWalletBalance(userData.walletBalance || 0)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Set event URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEventUrl(window.location.href)
    }
  }, [])

  // Check event status
  useEffect(() => {
    if (!eventData) return

    const now = new Date()
    const eventDate = new Date(eventData.eventDate)
    const eventEndDate = new Date(eventData.eventEndDate)

    // Check if event is today
    const isToday =
      now.getDate() === eventDate.getDate() &&
      now.getMonth() === eventDate.getMonth() &&
      now.getFullYear() === eventDate.getFullYear()
    setIsEventToday(isToday)

    // Check if event has passed
    const hasPassed = now > eventEndDate
    setIsEventPassed(hasPassed)

    // Check if sold out
    if (eventData.enableMaxSize && eventData.maxSize) {
      const soldOut = (eventData.ticketsSold || 0) >= parseInt(eventData.maxSize)
      setIsSoldOut(soldOut)
    }

    // Check if sale has ended
    if (eventData.enableStopDate && eventData.stopDate) {
      const stopDate = new Date(eventData.stopDate)
      const saleEnded = now > stopDate
      setIsSaleEnded(saleEnded)
    }
  }, [eventData])

  // Handle scroll for button position
  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return

      const footerRect = footerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // If footer is visible, keep button at top
      if (footerRect.top <= windowHeight) {
        setButtonPosition("top")
      } else {
        setButtonPosition("bottom")
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Page loaded effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      alert("Please login to like this event")
      return
    }

    if (isLiking || !eventData) return

    setIsLiking(true)

    try {
      const currentUser = auth.currentUser
      if (!currentUser) return

      const eventDocRef = doc(db, "events", creatorId, "userEvents", eventId)

      if (isLiked) {
        // Unlike
        await updateDoc(eventDocRef, {
          likes: (eventData.likes || 1) - 1,
          likedBy: arrayRemove(currentUser.uid),
        })
        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        // Like
        await updateDoc(eventDocRef, {
          likes: (eventData.likes || 0) + 1,
          likedBy: arrayUnion(currentUser.uid),
        })
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }

      // Update cache
      sessionStorage.removeItem(cacheKey)
    } catch (error) {
      console.error("Error toggling like:", error)
      alert("Failed to update like. Please try again.")
    } finally {
      setIsLiking(false)
    }
  }

  const handleBuyTicket = () => {
    if (!isAuthenticated) {
      alert("Please login to purchase tickets")
      return
    }
    router.push(`/event/${creatorId}/${eventId}/buy-ticket`)
  }

  const handleShowPassedDialog = () => {
    setShowPassedDialog(true)
  }

  const handleClosePassedDialog = () => {
    setShowPassedDialog(false)
  }

  if (!isPageLoaded) {
    return <Preloader />
  }

  if (loading) {
    return <EventSkeleton />
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-3 bg-[#6b2fa5] text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Events
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <UserHeader />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-[#6b2fa5] transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-purple-100 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-medium hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                  <Wallet size={18} className="text-[#6b2fa5]" />
                  <span className="font-semibold text-gray-900">₦{formatNumber(walletBalance)}</span>
                </div>
              )}

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors group"
              >
                <Flag size={18} className="text-gray-600 group-hover:text-red-600" />
                <span className="font-medium text-gray-700 group-hover:text-red-600 hidden sm:inline">Report</span>
              </button>

              {!isAuthenticated && <LoginButton />}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image/Carousel */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {eventData.eventImages && eventData.eventImages.length > 1 ? (
                  <ImageCarousel images={eventData.eventImages} eventName={eventData.eventName} />
                ) : (
                  <LazyImage
                    src={eventData.eventImage || "/placeholder.svg"}
                    alt={eventData.eventName}
                    className="w-full h-[300px] sm:h-[400px] lg:h-[500px]"
                    eventName={eventData.eventName}
                    showFullscreenIcon={true}
                  />
                )}
              </div>

              {/* Event Details Tab */}
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
              <LocationSection eventVenue={eventData.eventVenue} eventName={""} />

              {/* Merchandise Section */}
              <MerchSection eventId={eventId} creatorId={creatorId} />

              {/* Reviews Section */}
              <ReviewsSection
                eventId={eventId}
                eventName={eventData.eventName}
                eventEndDate={eventData.eventEndDate}
                eventEnd={eventData.eventEnd}
                hasEventEnded={hasEventEnded()}
                isAuthenticated={isAuthenticated}
              />
            </div>

            {/* Right Column - Ticket Purchase & Booker Details */}
            <div className="space-y-6 lg:relative lg:z-0">
              {/* Ticket Purchase Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border-2 border-purple-100 lg:sticky lg:top-6 lg:z-10">
                <div className="mb-6">
                  {eventData.isFree ? (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg mb-4">
                        <Ticket size={24} />
                        <span className="text-2xl font-bold">FREE EVENT</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <p className="text-gray-600 mb-2">Starting from</p>
                      <p className="text-4xl font-bold text-[#6b2fa5]">
                        ₦
                        {formatNumber(
                          eventData.ticketPrices && eventData.ticketPrices.length > 0
                            ? Math.min(...eventData.ticketPrices.map((t) => t.price))
                            : 0,
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Get Your Tickets</h3>
                
                {/* Ticket Prices */}
                {!eventData.isFree && eventData.ticketPrices && eventData.ticketPrices.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Ticket Options:</p>
                    {eventData.ticketPrices.map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium text-gray-800">{ticket.policy}</span>
                        <span className="font-bold text-[#6b2fa5]">
                          ₦{formatNumber(ticket.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ticket Stats */}
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                  {eventData.enableMaxSize && eventData.maxSize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tickets Sold:</span>
                      <span className="font-semibold text-gray-900">
                        {eventData.ticketsSold || 0} / {eventData.maxSize}
                      </span>
                    </div>
                  )}
                  {eventData.enableStopDate && eventData.stopDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sales End:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(eventData.stopDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isEventPassed ? (
                  <button
                    onClick={handleShowPassedDialog}
                    className="w-full bg-gray-400 text-white py-3.5 px-6 rounded-lg font-semibold text-lg cursor-not-allowed shadow-md"
                    disabled
                  >
                    Event Has Passed
                  </button>
                ) : isSoldOut ? (
                  <button
                    className="w-full bg-gray-400 text-white py-3.5 px-6 rounded-lg font-semibold text-lg cursor-not-allowed shadow-md"
                    disabled
                  >
                    Sold Out
                  </button>
                ) : isSaleEnded ? (
                  <button
                    className="w-full bg-gray-400 text-white py-3.5 px-6 rounded-lg font-semibold text-lg cursor-not-allowed shadow-md"
                    disabled
                  >
                    Sales Ended
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBuyTicketDialog(true)}
                    className="w-full bg-gradient-to-r from-[#6b2fa5] to-purple-700 text-white py-3.5 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Ticket size={22} />
                      {eventData.isFree ? "Register Now" : "Buy Tickets"}
                      {isEventToday && <span className="animate-pulse">🔥</span>}
                    </div>
                  </button>
                )}
              </div>

              {/* Booker Details Section */}
              <div ref={bookerDetailsRef} className="lg:relative lg:z-0">
                <BookerDetailsSection
                  bookerDetails={bookerDetails}
                  bookerName={eventData.bookerName}
                  creatorId={eventData.createdBy}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Buy Ticket Button */}
        <div
          className={`
            lg:hidden
            ${buttonPosition === "bottom" ? "fixed bottom-0 left-0 right-0" : ""}
            ${buttonPosition === "top" ? "fixed top-16 left-0 right-0" : ""}
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
                className="w-full bg-gradient-to-r from-[#6b2fa5] to-purple-700 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
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
                className="w-full bg-[#6b2fa5] text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
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