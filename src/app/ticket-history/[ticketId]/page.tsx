"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, Clock, MapPin, QrCode, Sparkles, Download, Scan } from "lucide-react"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import QRCode from "react-qr-code"
import html2canvas from "html2canvas"
import FaceEmbeddingModal from "@/components/FaceEmbeddingModal"

interface TicketDetails {
  id: string
  eventId: string
  eventName: string
  eventType: string
  ticketType: string
  ticketPrice: number
  ticketReference: string
  purchaseDate: string
  purchaseTime: string
  paymentMethod: string
  eventCreatorId?: string
  eventDate?: string
  eventEndDate?: string
  eventStart?: string
  eventEnd?: string
  eventVenue?: string
  stopDate?: string
}

export default function TicketHistoryInfo() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.ticketId as string
  const ticketRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [generatingQr, setGeneratingQr] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showFaceEmbeddingModal, setShowFaceEmbeddingModal] = useState(false)

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return "Not specified"
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      try {
        const [hours, minutes] = timeString.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
      } catch {
        return timeString
      }
    }
    return timeString
  }



  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        if (!ticketId) {
          setError("Ticket ID not found")
          setLoading(false)
          return
        }

        const response = await fetch(`/api/v1/ticket/${ticketId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.status === 401) {
          router.push("/auth/login")
          return
        }

        if (response.status === 403) {
          setError("You do not have permission to access this ticket")
          setLoading(false)
          return
        }

        if (response.status === 404) {
          setError("Ticket not found")
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch ticket: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.ticket) {
          const ticketData: TicketDetails = {
            id: data.ticket.id,
            eventId: data.ticket.eventId,
            eventName: data.ticket.eventName,
            eventType: data.ticket.eventType,
            ticketType: data.ticket.ticketType,
            ticketPrice: data.ticket.ticketPrice,
            ticketReference: data.ticket.ticketReference,
            purchaseDate: data.ticket.purchaseDate,
            purchaseTime: data.ticket.purchaseTime,
            paymentMethod: data.ticket.paymentMethod,
            eventCreatorId: data.ticket.eventCreatorId,
            eventDate: data.ticket.eventDate,
            eventEndDate: data.ticket.eventEndDate,
            eventStart: data.ticket.eventStart,
            eventEnd: data.ticket.eventEnd,
            eventVenue: data.ticket.eventVenue,
            stopDate: data.ticket.stopDate,
          }

          setTicketDetails(ticketData)
        }

        setLoading(false)
      } catch (err) {
        console.error("[v0] Error fetching ticket:", err)
        setError("Failed to load ticket details")
        setLoading(false)
      }
    }

    fetchTicketDetails()
  }, [ticketId, router])

  const handleGenerateQR = () => {
    setGeneratingQr(true)
    setTimeout(() => {
      setQrCodeGenerated(true)
      setGeneratingQr(false)
    }, 1500)
  }

  const handleDownloadTicket = async () => {
    if (!ticketRef.current || !ticketDetails || !qrCodeGenerated) return

    setIsDownloading(true)
    try {
      const element = ticketRef.current
      const canvas = await html2canvas(element)
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `ticket-${ticketDetails.ticketReference}.png`
      link.click()
    } catch (error) {
      console.error("  Error downloading ticket:", error)
      alert("Failed to download ticket")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!ticketDetails?.eventDate) {
      alert("Event date not available")
      return
    }

    try {
      const startDate = new Date(ticketDetails.eventDate)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + 2)

      const formatDateForCalendar = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, "")
      }

      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ticketDetails.eventName)}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&location=${encodeURIComponent(ticketDetails.eventVenue || "Event Venue")}`

      window.open(calendarUrl, "_blank")
    } catch (error) {
      console.error("  Error adding to calendar:", error)
      alert("Failed to add event to calendar")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    )
  }

  if (error || !ticketDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || "An error occurred"}</h2>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <UserHeader />

      <div className="flex-grow px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white hover:text-gray-300 mb-8 font-medium w-fit"
        >
          <ArrowLeft size={20} />
          Back to Tickets
        </button>

        {/* Main Container - Responsive Grid */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Card - Takes 2 columns on large screens */}
          <div ref={ticketRef} className="lg:col-span-2">
            {/* Physical Ticket Design */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Ticket Header - Premium Style */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-12 text-white">
                <h1 className="text-4xl font-bold mb-2">{ticketDetails.eventName}</h1>
                <p className="text-purple-100 text-lg">{ticketDetails.eventType}</p>
              </div>

              {/* Ticket Body */}
              <div className="p-8 lg:p-10">
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-10 border-b-2 border-dashed border-gray-300">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date & Time</h3>
                    <p className="text-2xl font-bold text-gray-900 mb-3">{ticketDetails.eventDate && formatDisplayDate(ticketDetails.eventDate)}</p>
                    {ticketDetails.eventStart && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <Clock size={16} className="text-purple-600" />
                        {formatDisplayTime(ticketDetails.eventStart)}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Location</h3>
                    <p className="text-lg font-semibold text-gray-900 mb-3">{ticketDetails.eventVenue || "Not specified"}</p>
                    <p className="text-gray-600 flex items-center gap-2">
                      <MapPin size={16} className="text-purple-600" />
                      Event Venue
                    </p>
                  </div>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-10 border-b-2 border-dashed border-gray-300">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Ticket Type</h3>
                    <p className="text-xl font-bold text-gray-900">{ticketDetails.ticketType}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Price</h3>
                    <p className="text-2xl font-bold text-purple-600">₦{ticketDetails.ticketPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Reference</h3>
                    <p className="text-lg font-mono text-gray-900 break-all">{ticketDetails.ticketReference}</p>
                  </div>
                </div>

                {/* Ticket ID - Prominently displayed */}
                <div className="mb-10 pb-10 border-b-2 border-dashed border-gray-300">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Ticket Number</h3>
                  <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">{ticketId}</p>
                </div>

                {/* Purchase Info */}
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Purchase Date</h3>
                    <p className="text-gray-900 font-medium">{ticketDetails.purchaseDate}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Purchase Time</h3>
                    <p className="text-gray-900 font-medium">{ticketDetails.purchaseTime}</p>
                  </div>
                </div>

                {/* Spotix Footer */}
                <div className="text-center text-sm text-gray-500 pt-6">
                  <p className="font-semibold">Powered by Spotix</p>
                  <p className="text-xs mt-1">Your trusted ticketing partner</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - QR Code & Actions */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* QR Code Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Entry Pass</h3>
              {!qrCodeGenerated ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <QrCode size={64} className="text-gray-300 mb-4" />
                  <p className="text-sm text-gray-600 text-center mb-6">Generate your QR code for entry</p>
                  <button
                    onClick={handleGenerateQR}
                    disabled={generatingQr}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {generatingQr ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="p-3 bg-gray-50 border-2 border-purple-200 rounded-lg mb-4 w-fit">
                    <QRCode value={ticketId} size={180} level="H" fgColor="#6b2fa5" bgColor="#ffffff" />
                  </div>
                  <p className="text-xs text-gray-600 text-center mb-4">
                    Show only to official check-in staff
                  </p>
                  <button
                    onClick={() => setQrCodeGenerated(false)}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    Hide QR Code
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons - Stacked on sidebar */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCalendar}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                <Calendar size={18} />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setShowFaceEmbeddingModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                <Scan size={18} />
                <span>Face ID</span>
              </button>
              {qrCodeGenerated && (
                <button
                  onClick={handleDownloadTicket}
                  disabled={isDownloading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Download size={18} />
                  <span>{isDownloading ? "Downloading..." : "Download"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Face Embedding Modal */}
      <FaceEmbeddingModal
        isOpen={showFaceEmbeddingModal}
        ticketId={ticketId}
        eventId={ticketDetails?.eventId || ""}
        onClose={() => setShowFaceEmbeddingModal(false)}
        onSuccess={() => {
          // Optionally refresh ticket details or show a success message
          console.log("[v0] Face embedding saved successfully")
        }}
      />

      <Footer />
    </div>
  )
}
