"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/app/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"
import AddPhoneNumber from "./Addphonenumber"

interface PayWithPaystackProps {
  email: string
  amount: number
  reference: string
  metadata: {
    eventId: string
    eventName: string
    ticketType: string
    ticketPrice: number
    eventCreatorId: string
    userId: string
    discountCode?: string | null
    referralCode?: string | null
  }
  onSuccess: (reference: string) => void
  onClose: () => void
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export default function PayWithPaystack({
  email,
  amount,
  reference,
  metadata,
  onSuccess,
  onClose,
}: PayWithPaystackProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load Paystack inline script
  useEffect(() => {
    if (window.PaystackPop) {
      setScriptLoaded(true)
      setLoading(false)
      return
    }

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => {
      setScriptLoaded(true)
      setLoading(false)
    }
    script.onerror = () => {
      setError("Failed to load Paystack. Please check your internet connection.")
      setLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Check if user has phone number
  useEffect(() => {
    const checkPhoneNumber = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          setError("You must be logged in to proceed")
          setCheckingPhone(false)
          return
        }

        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const userPhone = userData.phoneNumber

          if (userPhone && userPhone.trim() !== "") {
            setPhoneNumber(userPhone)
            setCheckingPhone(false)
          } else {
            // No phone number, show modal
            setShowPhoneNumberModal(true)
            setCheckingPhone(false)
          }
        } else {
          setShowPhoneNumberModal(true)
          setCheckingPhone(false)
        }
      } catch (error) {
        console.error("Error checking phone number:", error)
        setError("Failed to verify your information. Please try again.")
        setCheckingPhone(false)
      }
    }

    checkPhoneNumber()
  }, [])

  const handlePhoneNumberAdded = (phone: string) => {
    setPhoneNumber(phone)
    setShowPhoneNumberModal(false)
  }

  const initializePayment = () => {
    if (!window.PaystackPop) {
      setError("Paystack is not loaded. Please refresh the page.")
      return
    }

    if (!phoneNumber) {
      setShowPhoneNumberModal(true)
      return
    }

    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!paystackPublicKey) {
      setError("Payment configuration error. Please contact support.")
      return
    }

    try {
      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Transaction Type",
              variable_name: "type",
              value: "ticket_purchase",
            },
            {
              display_name: "Event Name",
              variable_name: "event_name",
              value: metadata.eventName,
            },
            {
              display_name: "Ticket Type",
              variable_name: "ticket_type",
              value: metadata.ticketType,
            },
            {
              display_name: "Event ID",
              variable_name: "event_id",
              value: metadata.eventId,
            },
            {
              display_name: "Event Creator",
              variable_name: "event_creator_id",
              value: metadata.eventCreatorId,
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: metadata.userId,
            },
            {
              display_name: "Phone Number",
              variable_name: "phone_number",
              value: phoneNumber,
            },
            ...(metadata.discountCode
              ? [
                  {
                    display_name: "Discount Code",
                    variable_name: "discount_code",
                    value: metadata.discountCode,
                  },
                ]
              : []),
            ...(metadata.referralCode
              ? [
                  {
                    display_name: "Referral Code",
                    variable_name: "referral_code",
                    value: metadata.referralCode,
                  },
                ]
              : []),
          ],
        },
        callback: (response: any) => {
          console.log("Payment successful:", response)
          onSuccess(response.reference)
        },
        onClose: () => {
          console.log("Payment modal closed")
          onClose()
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Error initializing payment:", error)
      setError("Failed to initialize payment. Please try again.")
    }
  }

  // Auto-initialize payment when ready
  useEffect(() => {
    if (scriptLoaded && !checkingPhone && phoneNumber && !error) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        initializePayment()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [scriptLoaded, checkingPhone, phoneNumber, error])

  if (showPhoneNumberModal) {
    return (
      <AddPhoneNumber
        onPhoneNumberAdded={handlePhoneNumberAdded}
        onClose={onClose}
      />
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Payment Error</h3>
              <p className="text-sm text-gray-600">Something went wrong</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                window.location.reload()
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading || checkingPhone) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {checkingPhone ? "Verifying Information..." : "Initializing Payment..."}
            </h3>
            <p className="text-gray-600 mb-6">
              {checkingPhone
                ? "Please wait while we verify your details"
                : "Please wait while we connect to Paystack"}
            </p>
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span className="text-purple-600 font-medium">
                {checkingPhone ? "Checking..." : "Loading..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}