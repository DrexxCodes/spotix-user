"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, Clock, MapPin, QrCode, Sparkles, Download } from "lucide-react"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import QRCode from "react-qr-code"
import html2canvas from "html2canvas"

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
  const [isEventDay, setIsEventDay] = useState(false)
  const [showSecurityDialog, setShowSecurityDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

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

  const checkIfEventDay = (eventDate?: string) => {
    if (!eventDate) return false
    try {
      const today = new Date()
      const eventDateObj = new Date(eventDate)
      today.setHours(0, 0, 0, 0)
      eventDateObj.setHours(0, 0, 0, 0)
      return today.getTime() >= eventDateObj.getTime()
    } catch {
      return false
    }
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
          setIsEventDay(checkIfEventDay(ticketData.eventDate))
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
    if (!isEventDay) {
      setShowSecurityDialog(true)
      return
    }

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Tickets
        </button>

        {/* Ticket Card */}
        <div ref={ticketRef} className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket Details</h1>
            <p className="text-gray-600">Event: {ticketDetails.eventName}</p>
          </div>

          {/* Event Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Event Name</span>
                <span className="font-medium text-gray-900">{ticketDetails.eventName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Event Type</span>
                <span className="font-medium text-gray-900">{ticketDetails.eventType}</span>
              </div>
              {ticketDetails.eventVenue && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <MapPin size={16} />
                    Venue
                  </span>
                  <span className="font-medium text-gray-900">{ticketDetails.eventVenue}</span>
                </div>
              )}
              {ticketDetails.eventDate && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} />
                    Event Date
                  </span>
                  <span className="font-medium text-gray-900">{formatDisplayDate(ticketDetails.eventDate)}</span>
                </div>
              )}
              {ticketDetails.eventStart && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock size={16} />
                    Start Time
                  </span>
                  <span className="font-medium text-gray-900">{formatDisplayTime(ticketDetails.eventStart)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ticket Type</span>
                <span className="font-medium text-gray-900">{ticketDetails.ticketType}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Price</span>
                <span className="font-medium text-purple-600 text-lg">
                  ₦{ticketDetails.ticketPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ticket ID</span>
                <span className="font-medium text-gray-900 font-mono text-sm">
                  {isEventDay ? ticketId : "Shown on event day"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Reference</span>
                <span className="font-medium text-gray-900">{ticketDetails.ticketReference}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900">{ticketDetails.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 flex items-center gap-2">
                  <Calendar size={16} />
                  Purchase Date
                </span>
                <span className="font-medium text-gray-900">{ticketDetails.purchaseDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  Purchase Time
                </span>
                <span className="font-medium text-gray-900">{ticketDetails.purchaseTime}</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Entry QR Code</h2>
            {!qrCodeGenerated ? (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <QrCode size={48} className="text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">Generate your QR code for event entry</p>
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQr}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {generatingQr ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate QR Code</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="p-4 bg-white border-2 border-purple-200 rounded-lg mb-4">
                  <QRCode value={ticketId} size={200} level="H" fgColor="#6b2fa5" bgColor="#ffffff" />
                </div>
                <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
                  No Spotix Staff or Event planner will ever ask you for your ID. Present this only to the event's
                  check-in staff.
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

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>Powered by Spotix</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAddToCalendar}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            <Calendar size={18} />
            Add to Calendar
          </button>
          {qrCodeGenerated && (
            <button
              onClick={handleDownloadTicket}
              disabled={isDownloading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Download size={18} />
              {isDownloading ? "Downloading..." : "Download Ticket"}
            </button>
          )}
        </div>
      </div>

      {/* Security Dialog */}
      {showSecurityDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <QrCode size={24} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Ticket Security Notice</h3>
            </div>
            <p className="text-gray-600 mb-4">
              For your ticket security, the QR code can only be generated on the event day being{" "}
              <strong>
                {ticketDetails?.eventDate ? formatDisplayDate(ticketDetails.eventDate) : "the event date"}
              </strong>
              .
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This helps prevent unauthorized access and ensures your ticket remains secure until the event.
            </p>
            <button
              onClick={() => setShowSecurityDialog(false)}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
