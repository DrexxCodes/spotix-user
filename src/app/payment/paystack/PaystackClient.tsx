"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "../../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import Image from "next/image"

declare global {
  interface Window {
    PaystackPop: any
  }
}

interface PaymentData {
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

export default function PaystackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [paystackLoading, setPaystackLoading] = useState(false)
  const [paymentClosed, setPaymentClosed] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [reference, setReference] = useState<string>("")
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string>("")
  const [initializationAttempted, setInitializationAttempted] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const handlerRef = useRef<any>(null)

  useEffect(() => {
    const urlReference = searchParams.get("reference")
    if (urlReference) {
      setReference(urlReference)
      setPaymentClosed(true)
      setCountdown(30)
      startPaymentVerification(urlReference)
    }
  }, [searchParams])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/auth/login")
      }
    })

    const storedPaymentData = sessionStorage.getItem("spotix_payment_data")
    if (storedPaymentData) {
      const parsedData = JSON.parse(storedPaymentData)
      setPaymentData(parsedData)
      localStorage.setItem("paystack_payment_data", storedPaymentData)
    }

    setLoading(false)
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (paymentData && user && !reference && !paymentClosed && !initializationAttempted) {
      initializePaystack()
    }
  }, [paymentData, user, reference, paymentClosed, initializationAttempted])

  useEffect(() => {
    if (paymentClosed && countdown > 0 && reference) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleCountdownComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      if (!verifyingPayment) {
        startPaymentVerification(reference)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [paymentClosed, countdown, reference])

  const initializePaystack = async () => {
    if (!paymentData || !user || paystackLoading || initializationAttempted) return

    setInitializationAttempted(true)
    setPaystackLoading(true)

    try {
      if (window.PaystackPop) {
        openPaystackDialog()
        return
      }

      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      script.onload = () => {
        console.log("[v0] Paystack script loaded successfully")
        openPaystackDialog()
      }
      script.onerror = () => {
        console.error("[v0] Failed to load Paystack script")
        setPaystackLoading(false)
        // Replaced alert with console message for better user experience
        console.error("Failed to load payment service. Please check your internet connection and try again.")
      }
      document.head.appendChild(script)
    } catch (error) {
      console.error("[v0] Error initializing Paystack:", error)
      setPaystackLoading(false)
    }
  }

  const openPaystackDialog = () => {
    try {
      if (!window.PaystackPop) {
        console.error("[v0] PaystackPop not available")
        setPaystackLoading(false)
        return
      }

      if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        console.error("[v0] Paystack public key not configured")
        setPaystackLoading(false)
        console.error("Payment service not configured. Please contact support.")
        return
      }

      const transactionFee = 150
      const totalAmount = (paymentData!.ticketPrice + transactionFee) * 100

      console.log("[v0] Opening Paystack dialog with amount:", totalAmount)

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: totalAmount,
        currency: "NGN",
        metadata: {
          eventId: paymentData!.eventId,
          eventName: paymentData!.eventName,
          ticketType: paymentData!.ticketType,
          eventCreatorId: paymentData!.eventCreatorId,
          userId: user.uid,
        },
        onClose: () => {
          console.log("[v0] Paystack dialog closed")
          setPaystackLoading(false)
          setPaymentClosed(true)
          setCountdown(30)
        },
        callback: (response: any) => {
          console.log("[v0] Paystack callback:", response)
          setPaystackLoading(false)
          if (response.status === "success") {
            const paystackReference = response.reference
            console.log("[v0] Paystack generated reference:", paystackReference)

            const newUrl = new URL(window.location.href)
            newUrl.searchParams.set("reference", paystackReference)
            window.history.replaceState({}, "", newUrl.toString())

            setReference(paystackReference)
            router.push(`/payment/paystack-success?reference=${paystackReference}`)
          }
        },
      })

      handlerRef.current = handler
      setPaystackLoading(false)
      handler.openIframe()
    } catch (error) {
      console.error("[v0] Error opening Paystack dialog:", error)
      setPaystackLoading(false)
      console.error("Failed to open payment dialog. Please try again.")
    }
  }

  const startPaymentVerification = (ref: string) => {
    if (verifyingPayment) return

    setVerifyingPayment(true)
    setPaymentStatus("Verifying payment...")

    verificationIntervalRef.current = setInterval(async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        if (!backendUrl) {
          console.error("Backend URL not configured")
          return
        }

        const response = await fetch(`${backendUrl}/api/payment/verify?reference=${ref}`)
        const data = await response.json()

        let isPaymentSuccessful = false
        if (data && typeof data === "object") {
          if (data.status === true && data.data && data.data.status === "success") {
            isPaymentSuccessful = true
          } else if (data.status === "success") {
            isPaymentSuccessful = true
          } else if (data.data && data.data.status === "success") {
            isPaymentSuccessful = true
          } else if (data.success === true) {
            isPaymentSuccessful = true
          }
        }

        if (isPaymentSuccessful) {
          setPaymentStatus("Payment verified! Redirecting...")
          clearInterval(verificationIntervalRef.current!)
          setVerifyingPayment(false)

          router.push(`/payment/paystack-success?reference=${ref}`)
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setPaymentStatus("Checking payment status...")
      }
    }, 3000)
  }

  const handleCountdownComplete = () => {
    if (verificationIntervalRef.current) {
      clearInterval(verificationIntervalRef.current)
    }
    setVerifyingPayment(false)
    setPaymentStatus("Payment verification timeout. Redirecting...")

    setTimeout(() => {
      router.push("/payment")
    }, 2000)
  }

  const handleRetryPayment = () => {
    console.log("[v0] Retrying payment...")

    if (verificationIntervalRef.current) {
      clearInterval(verificationIntervalRef.current)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (handlerRef.current) {
      handlerRef.current.close()
    }

    setVerifyingPayment(false)
    setPaymentClosed(false)
    setCountdown(30)
    setReference("")
    setPaystackLoading(false)
    setInitializationAttempted(false)

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete("reference")
    window.history.replaceState({}, "", newUrl.toString())

    setTimeout(() => {
      initializePaystack()
    }, 1000)
  }

  if (loading || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium z-50">
        ⚠️ Do not refresh this page during payment
      </div>

      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Image src="/logo.svg" alt="Spotix" width={120} height={40} className="mx-auto" />
        </div>

        {paystackLoading ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Loading Payment</h2>
            <p className="text-purple-200">Please hold while we securely load up the payment service</p>
          </>
        ) : paymentClosed ? (
          <>
            <div className="text-yellow-400 mb-6">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {verifyingPayment ? "Verifying Payment" : "Payment Window Closed"}
            </h2>
            <p className="text-purple-200 mb-4">
              {verifyingPayment
                ? paymentStatus
                : `Payment window closed. We're checking if payment was completed (${countdown}s)`}
            </p>

            {verifyingPayment && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            )}

            <div className="w-full bg-white/20 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-[#6b2fa5] to-purple-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((30 - countdown) / 30) * 100}%` }}
              ></div>
            </div>

            {!verifyingPayment && countdown > 0 && (
              <button
                onClick={handleRetryPayment}
                className="bg-gradient-to-r from-[#6b2fa5] to-purple-600 hover:from-purple-600 hover:to-[#6b2fa5] text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
              >
                Retry Payment
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Payment Ready</h2>
            <p className="text-purple-200 mb-6">
              Your payment dialog should have opened. If not, please check for popup blockers.
            </p>
            <div className="text-sm text-purple-300">
              Event: {paymentData.eventName}
              <br />
              Ticket: {paymentData.ticketType}
              <br />
              Amount: ₦{paymentData.ticketPrice.toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
