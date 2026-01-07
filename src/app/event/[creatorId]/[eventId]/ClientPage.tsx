"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
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

  // Fetch Event Data
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

        const eventDocRef = doc(db, "events", creatorId, "userEvents", eventId)
        const eventDoc = await getDoc(eventDocRef)

        if (!eventDoc.exists()) {
          router.push("/404")
          return
        }

        const data = { id: eventDoc.id, ...eventDoc.data() } as EventType
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
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [creatorId, eventId, router, cacheKey, cacheDuration])

  // Fetch booker details
  useEffect(() => {
    if (!eventData?.createdBy) return

    const fetchBookerDetails = async () => {
      try {
        const userDocRef = doc(db, "users", eventData.createdBy)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setBookerDetails({
            username: userData.username || "Unknown",
            email: userData.email || "",
            phone: userData.phone || "",
            isVerified: userData.isVerified || false,
          })
        }
      } catch (error) {
        console.error("Error fetching booker details:", error)
      }
    }

    fetchBookerDetails()
  }, [eventData?.createdBy])

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true)
        try {
          const userDocRef = doc(db, "users", user.uid)
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

    if (isLiking) return

    setIsLiking(true)
    const currentUser = auth.currentUser

    if (!currentUser) {
      setIsLiking(false)
      return
    }

    try {
      const eventDocRef = doc(db, "events", creatorId, "userEvents", eventId)

      if (isLiked) {
        // Unlike
        await updateDoc(eventDocRef, {
          likes: Math.max(0, likeCount - 1),
          likedBy: arrayRemove(currentUser.uid),
        })
        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        // Like
        await updateDoc(eventDocRef, {
          likes: likeCount + 1,
          likedBy: arrayUnion(currentUser.uid),
        })
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }

      // Update cache
      if (eventData) {
        const updatedData = {
          ...eventData,
          likes: isLiked ? Math.max(0, likeCount - 1) : likeCount + 1,
          likedBy: isLiked
            ? (eventData.likedBy || []).filter((id) => id !== currentUser.uid)
            : [...(eventData.likedBy || []), currentUser.uid],
        }
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedData,
            timestamp: Date.now(),
          }),
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      // Revert on error
      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)))
    } finally {
      setIsLiking(false)
    }
  }


const handleBuyTicket = (ticketType: string, ticketPrice: number | string) => {
  if (!eventData) {
    console.error("No event data available")
    return
  }

  // Check if event has passed
  if (isEventPassed) {
    setShowPassedDialog(true)
    return
  }

  // Check if sold out
  if (isSoldOut) {
    alert("Sorry, this event is sold out!")
    return
  }

  // Check if sales ended
  if (isSaleEnded) {
    alert("Sorry, ticket sales have ended for this event!")
    return
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Save current path to redirect back after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
    }
    router.push("/auth/login")
    return
  }

  // Ensure price is a number
  const parsedPrice = typeof ticketPrice === "string" 
    ? parseFloat(ticketPrice) 
    : ticketPrice


  const paymentData = {
    eventId: eventId,
    eventName: eventData.eventName,
    ticketType: ticketType,
    ticketPrice: parsedPrice,
    eventCreatorId: creatorId,
  }

  // Store in sessionStorage for the payment page to read
  if (typeof window !== 'undefined') {
    sessionStorage.setItem("spotix_payment_data", JSON.stringify(paymentData))
  }

  console.log("✅ Payment data stored in sessionStorage:", paymentData)
  console.log("🚀 Navigating to payment page...")

  // Close the buy ticket dialog
  setShowBuyTicketDialog(false)

  // Navigate to payment page
  router.push("/payment")
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
    return (
      <>
        <UserHeader />
        <EventSkeleton />
      </>
    )
  }

  if (!eventData) {
    return (
      <>
        <UserHeader />
        <div className="max-w-7xl mx-auto p-4 text-center py-20">
          <AlertCircle size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/home")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Events
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
        {/* Header Section - Full Width */}
        <div className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-2 rounded-lg shadow-md">
                    <Wallet size={18} className="text-white" />
                    <span className="text-white font-medium">Balance:</span>
                    <span className="text-white font-bold">₦{formatNumber(walletBalance)}</span>
                  </div>
                ) : (
                  <LoginButton />
                )}
                
                {/* Report Button */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                  title="Report Event"
                >
                  <Flag size={18} />
                  <span className="hidden sm:inline font-medium">Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrolling Marquee */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 text-white py-2.5 overflow-hidden">
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
        </div>

        {/* Main Content - Two Column Layout for Desktop */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Event Status Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {isEventToday && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                🔥 Happening Today!
              </span>
            )}
            {isSoldOut && (
              <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                ❌ Sold Out
              </span>
            )}
            {isSaleEnded && (
              <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                ⏰ Sales Ended
              </span>
            )}
            {isEventPassed && (
              <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                📅 Event Passed
              </span>
            )}
          </div>

          {/* Desktop Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Main Content (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image Carousel */}
              <ImageCarousel
                mainImage={eventData.eventImage || "/placeholder.svg"}
                additionalImages={eventData.eventImages || []}
                eventName={eventData.eventName}
              />

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
            </div>

            {/* Right Column - Sidebar (1/3 width on desktop, sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Ticket Purchase Card - Desktop Only Sticky */}
                <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Get Your Tickets</h3>
                  
                  {/* Ticket Prices */}
                  {!eventData.isFree && eventData.ticketPrices && eventData.ticketPrices.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <p className="text-sm font-medium text-gray-600 mb-2">Ticket Options:</p>
                      {eventData.ticketPrices.map((ticket, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium text-gray-800">{ticket.policy}</span>
                          <span className="font-bold text-purple-600">
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
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3.5 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                <div ref={bookerDetailsRef}>
                  <BookerDetailsSection
                    bookerDetails={bookerDetails}
                    bookerName={eventData.bookerName}
                    creatorId={eventData.createdBy}
                  />
                </div>
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