"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/app/lib/firebase"
import { XCircle, Loader2, CheckCircle } from "lucide-react"
import Image from "next/image"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

interface PaymentDataFromLocalStorage {
  eventId: string
  eventName: string
  ticketType: string
  ticketPrice: number
  eventCreatorId: string
  originalPrice?: number
  discountApplied?: boolean
  discountCode?: string
  eventVenue?: string
  eventType?: string
  eventDate?: string
  eventEndDate?: string
  eventStart?: string
  eventEnd?: string
  stopDate?: string
  enableStopDate?: boolean
  bookerName?: string
  bookerEmail?: string
  transactionFee?: number
  totalAmount?: number
}

export default function PaystackSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [eventData, setEventData] = useState<PaymentDataFromLocalStorage | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log("[v0] Starting payment verification process")

        const reference = searchParams.get("reference")
        const trxref = searchParams.get("trxref")

        console.log("[v0] URL parameters:", { reference, trxref })

        if (!reference) {
          console.log("[v0] No reference found, redirecting to home")
          router.push("/")
          return
        }

        const user = auth.currentUser
        if (!user) {
          router.push("/auth/login")
          return
        }

        const paymentDataStr = localStorage.getItem("paystack_payment_data")
        if (!paymentDataStr) {
          setPaymentResult({
            success: false,
            message: "Payment data not found. Please try again.",
          })
          setLoading(false)
          return
        }

        const paymentData: PaymentDataFromLocalStorage = JSON.parse(paymentDataStr)
        setEventData(paymentData)
        console.log("[v0] Payment data loaded from localStorage")

        if (!BACKEND_URL) {
          console.error("[v0] No active Spotix backend for confirmation")
          setPaymentResult({
            success: false,
            message: "Configuration error. Please contact support.",
          })
          setLoading(false)
          return
        }

        const idToken = await user.getIdToken()

        console.log("[v0] Verifying payment with backend server")
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        try {
          const verifyResponse = await fetch(`${BACKEND_URL}/api/payment/verify?reference=${reference}`, {
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          const verifyData = await verifyResponse.json()

          let isPaymentSuccessful = false

          if (verifyData && typeof verifyData === "object") {
            if (verifyData.status === true && verifyData.data && verifyData.data.status === "success") {
              isPaymentSuccessful = true
              console.log("[v0] Payment verified - Structure 1")
            } else if (verifyData.status === "success") {
              isPaymentSuccessful = true
              console.log("[v0] Payment verified - Structure 2")
            } else if (verifyData.data && verifyData.data.status === "success") {
              isPaymentSuccessful = true
              console.log("[v0] Payment verified - Structure 3")
            } else if (verifyData.success === true) {
              isPaymentSuccessful = true
              console.log("[v0] Payment verified - Structure 4")
            }
          }

          if (isPaymentSuccessful) {
            console.log("[v0] Payment verified successfully, calling ticket API")

            const ticketResponse = await fetch("/api/ticket", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                eventId: paymentData.eventId,
                eventCreatorId: paymentData.eventCreatorId,
                userId: user.uid,
                paymentReference: reference,
                paymentMethod: "Paystack",
                ticketPrice: paymentData.ticketPrice,
                originalPrice: paymentData.originalPrice || paymentData.ticketPrice,
                transactionFee: paymentData.transactionFee || 150,
                totalAmount: paymentData.totalAmount || paymentData.ticketPrice + 150,
                currency: "NGN",
                ticketType: paymentData.ticketType,
                discountCode: paymentData.discountCode || undefined,
                discountApplied: paymentData.discountApplied || false,
                eventName: paymentData.eventName,
                eventVenue: paymentData.eventVenue,
                eventType: paymentData.eventType,
                eventDate: paymentData.eventDate,
                eventEndDate: paymentData.eventEndDate,
                eventStart: paymentData.eventStart,
                eventEnd: paymentData.eventEnd,
                stopDate: paymentData.stopDate,
                enableStopDate: paymentData.enableStopDate,
                bookerName: paymentData.bookerName,
                bookerEmail: paymentData.bookerEmail,
              }),
            })

            const ticketData = await ticketResponse.json()

            if (!ticketResponse.ok) {
              throw new Error(ticketData.error || "Failed to generate ticket")
            }

            console.log("[v0] Ticket generated successfully:", ticketData.ticketId)

            await sendConfirmationEmail(
              ticketData.ticketId,
              reference,
              {
                fullName: ticketData.userData.fullName,
                email: ticketData.userData.email,
              },
              paymentData,
            )

            // Clean up storage
            localStorage.removeItem("paystack_payment_data")
            sessionStorage.removeItem("spotix_payment_data")

            // Store ticket data for ticket page
            sessionStorage.setItem(
              "ticket_data",
              JSON.stringify({
                paymentResult: {
                  success: true,
                  message: "Payment successful",
                  ticketId: ticketData.ticketId,
                  ticketReference: reference,
                  userData: ticketData.userData,
                  finalPrice: paymentData.ticketPrice,
                  discountApplied: paymentData.discountApplied || false,
                },
                paymentData: {
                  eventId: paymentData.eventId,
                  eventName: paymentData.eventName,
                  ticketType: paymentData.ticketType,
                  ticketPrice: paymentData.originalPrice || paymentData.ticketPrice,
                  eventCreatorId: paymentData.eventCreatorId,
                  finalPrice: paymentData.ticketPrice,
                  transactionFee: paymentData.transactionFee || 150,
                  totalAmount: paymentData.totalAmount || paymentData.ticketPrice + 150,
                },
                eventDetails: ticketData.eventDetails,
              }),
            )

            router.push("/ticket")
          } else {
            console.log("[v0] Payment verification failed. API response:", verifyData)
            setPaymentResult({
              success: false,
              message: `Payment verification failed. ${verifyData?.message || "Please contact support."}`,
            })
            setLoading(false)
            localStorage.removeItem("paystack_payment_data")
          }
        } catch (apiError: any) {
          clearTimeout(timeoutId)
          console.error("[v0] API request failed:", apiError)
          setPaymentResult({
            success: false,
            message: `Network error: ${apiError.message || "Please check your connection."}`,
          })
          setLoading(false)
        }
      } catch (error: any) {
        console.error("[v0] Payment verification error:", error)
        setPaymentResult({
          success: false,
          message: `Verification error: ${error.message || "An unexpected error occurred."}`,
        })
        setLoading(false)
      }
    }

    verifyPayment()
  }, [router, searchParams])

  const sendConfirmationEmail = async (ticketId: string, ticketReference: string, userData: any, paymentData: any) => {
    if (!paymentData || !BACKEND_URL) return

    try {
      console.log("[v0] Sending confirmation email")
      const response = await fetch(`${BACKEND_URL}/api/mail/payment-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.fullName || userData.username || "Valued Customer",
          ticket_ID: ticketId,
          event_host: paymentData.bookerName || "Event Host",
          event_name: paymentData.eventName,
          payment_ref: ticketReference,
          ticket_type: paymentData.ticketType,
          booker_email: paymentData.bookerEmail || "support@spotix.com.ng",
          ticket_price: paymentData.ticketPrice.toFixed(2),
          payment_method: "Paystack",
          event_venue: paymentData.eventVenue || "Not specified",
          event_date: paymentData.eventDate || "Not specified",
          event_start: paymentData.eventStart || "Not specified",
          event_end: paymentData.eventEnd || "Not specified",
          transaction_id: ticketReference,
          transaction_date: new Date().toLocaleDateString(),
          transaction_time: new Date().toLocaleTimeString(),
        }),
      })

      if (!response.ok) {
        console.error("[v0] Failed to send confirmation email:", response.status, response.statusText)
      } else {
        console.log("[v0] Confirmation email sent successfully")
      }
    } catch (error) {
      console.error("[v0] Error sending confirmation email:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
          <Image src="/logo.svg" alt="Spotix" width={120} height={40} className="mx-auto mb-6" />
          <Loader2 className="animate-spin text-6xl text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Processing Payment</h2>
          <p className="text-purple-200">Please wait while we verify your payment...</p>
        </div>
      </div>
    )
  }

  if (paymentResult && !paymentResult.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
          <Image src="/logo.svg" alt="Spotix" width={120} height={40} className="mx-auto mb-6" />
          <XCircle size={60} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Payment Failed</h2>
          <p className="text-purple-200 mb-6">{paymentResult?.message || "Payment verification failed"}</p>
          <div className="flex gap-4">
            <button
              className="flex-1 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white font-semibold py-2 px-4 rounded-lg"
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
            <button
              className="flex-1 bg-white/20 text-white font-semibold py-2 px-4 rounded-lg"
              onClick={() => router.push("/payment")}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
        <Image src="/logo.svg" alt="Spotix" width={120} height={40} className="mx-auto mb-6" />
        <CheckCircle className="text-green-400 text-6xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Redirecting to Ticket...</h2>
        <p className="text-purple-200">Your payment was successful. Preparing your ticket...</p>
        <Loader2 className="animate-spin text-white mx-auto mt-4" />
      </div>
    </div>
  )
}
