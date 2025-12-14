"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Mail, Share2, Copy } from "lucide-react"
import { auth } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface TicketData {
  success: boolean
  ticketId: string
  reference: string
  eventName: string
  eventVenue: string
  eventDate: string
  eventTime: string
  ticketType: string
  amount: number
  userName: string
  userEmail: string
}

export default function TicketClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchTicketData()
      } else {
        router.push("/auth/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (ticketData?.success && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [ticketData, countdown])

  const fetchTicketData = async () => {
    const success = searchParams.get("success")
    const reference = searchParams.get("reference")
    const ticketId = searchParams.get("ticketId")

    if (success === "true" && reference && ticketId) {
      try {
        const response = await fetch(`/api/ticket/${ticketId}`, {
          headers: {
            Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTicketData(data)
        }
      } catch (error) {
        console.error("Error fetching ticket data:", error)
      }
    }

    setLoading(false)
  }

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleShare = () => {
    setShowShareOptions(!showShareOptions)
  }

  const shareToSocialMedia = (platform: string) => {
    if (!ticketData) return

    const shareText = `I just got ticket for this event, I'd hope you'll get too!`
    const shareUrl = `${window.location.origin}/discover/${encodeURIComponent(ticketData.eventName.toLowerCase().replace(/\s+/g, "-"))}`

    let shareLink = ""

    switch (platform) {
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
    }

    setShowShareOptions(false)
  }

  const copyShareLink = () => {
    if (!ticketData) return

    const shareText = `I just got ticket for this event, I'd hope you'll get too!`
    const shareUrl = `${window.location.origin}/discover/${encodeURIComponent(ticketData.eventName.toLowerCase().replace(/\s+/g, "-"))}`
    const fullText = `${shareText} ${shareUrl}`

    navigator.clipboard.writeText(fullText).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Ticket Not Found</h2>
          <p className="text-blue-200 mb-6">We couldn't find your ticket information.</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {ticketData.success ? (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-blue-200">Your ticket has been confirmed</p>
            </div>

            {/* Email Confirmation */}
            <div className="flex items-center justify-center space-x-2 mb-8 p-4 rounded-xl bg-blue-500/20 border border-blue-400/30">
              <Mail className="w-5 h-5 text-blue-400" />
              <p className="text-blue-200">A confirmation email has been sent to your registered email address.</p>
            </div>

            {/* Ticket Preview */}
            <div className="bg-white/5 rounded-2xl border border-white/20 p-6 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">SPOTIX</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mt-2"></div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Name:</span>
                  <span className="text-white font-medium">{ticketData.userName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Email:</span>
                  <span className="text-white font-medium">{ticketData.userEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Event:</span>
                  <span className="text-white font-medium">{ticketData.eventName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Venue:</span>
                  <span className="text-white font-medium">{ticketData.eventVenue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Date:</span>
                  <span className="text-white font-medium">{ticketData.eventDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Time:</span>
                  <span className="text-white font-medium">{ticketData.eventTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Ticket Type:</span>
                  <span className="text-white font-medium">{ticketData.ticketType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Ticket ID:</span>
                  <span className="text-white font-medium font-mono">{ticketData.ticketId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Reference:</span>
                  <span className="text-white font-medium font-mono">{ticketData.reference}</span>
                </div>
                <div className="flex justify-between text-sm pt-4 border-t border-white/20">
                  <span className="text-blue-200">Amount Paid:</span>
                  <span className="text-white font-bold">NGN {formatNumber(ticketData.amount)}</span>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Share Your Ticket</h3>
              <p className="text-blue-200 mb-4">Let your friends know about this event!</p>

              <div className="relative">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>

                {showShareOptions && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 min-w-[200px]">
                    <div className="space-y-2">
                      <button
                        onClick={() => shareToSocialMedia("whatsapp")}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-green-400">📱</span>
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => shareToSocialMedia("twitter")}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-blue-400">🐦</span>
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={() => shareToSocialMedia("facebook")}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-blue-600">📘</span>
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={copyShareLink}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-white hover:bg-white/10 rounded-lg transition-colors ${copySuccess ? "text-green-400" : ""}`}
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copySuccess ? "Copied!" : "Copy Link"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Success Message */}
            {countdown > 0 && (
              <div className="text-center p-4 rounded-xl bg-green-500/20 border border-green-400/30 mb-6">
                <p className="text-green-200">
                  Your payment was successful. Please wait ({countdown}) while we get your ticket ready.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/tickets")}
                className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                View My Tickets
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Go Home
              </button>
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Payment Failed</h1>
            <p className="text-blue-200 mb-6">There was an issue processing your payment.</p>
            <button
              onClick={() => router.push("/payment")}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
