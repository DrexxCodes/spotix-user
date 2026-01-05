"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface PayWithMonnifyProps {
  reference: string
  amount: number
  email: string
  onClose: () => void
  onSuccess: () => void
}

declare global {
  interface Window {
    MonnifySDK: {
      initialize: (config: any) => void
    }
  }
}

export default function PayWithMonnify({ reference, amount, email, onClose, onSuccess }: PayWithMonnifyProps) {
  const initialized = useRef(false)

  useEffect(() => {
    // Load Monnify SDK script if not already loaded
    if (!document.getElementById("monnify-sdk")) {
      const script = document.createElement("script")
      script.id = "monnify-sdk"
      script.src = "https://sdk.monnify.com/plugin/monnify.js"
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        initializeMonnify()
      }
    } else if (window.MonnifySDK && !initialized.current) {
      initializeMonnify()
    }

    return () => {
      // Cleanup if needed
    }
  }, [])

  const initializeMonnify = () => {
    if (initialized.current || !window.MonnifySDK) return
    initialized.current = true

    window.MonnifySDK.initialize({
      amount: amount,
      currency: "NGN",
      reference: reference,
      customerFullName: "Vote Customer",
      customerEmail: email || "guest@voting.com",
      apiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY || "MK_TEST_SAF7HR5F3F", // Replace with your API key
      contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE || "4934121693", // Replace with your contract code
      paymentDescription: "Vote Payment",
      metadata: {
        reference: reference,
      },
      isTestMode: process.env.NODE_ENV !== "production", // Set to false in production
      onLoadStart: () => {
        console.log("Monnify payment loading...")
      },
      onLoadComplete: () => {
        console.log("Monnify payment loaded successfully")
      },
      onComplete: (response: any) => {
        console.log("Payment completed:", response)
        if (response.status === "SUCCESS") {
          handlePaymentSuccess(response)
        } else {
          handlePaymentFailure(response)
        }
      },
      onClose: () => {
        console.log("Payment modal closed")
        onClose()
      },
    })
  }

  const handlePaymentSuccess = async (response: any) => {
    try {
      // Update payment reference in Firestore
      await fetch("/api/v1/vote/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: reference,
          status: "success",
          transactionReference: response.transactionReference,
          paymentReference: response.paymentReference,
        }),
      })

      onSuccess()
    } catch (error) {
      console.error("Error updating payment status:", error)
      alert("Payment was successful but there was an error updating the records. Please contact support.")
    }
  }

  const handlePaymentFailure = async (response: any) => {
    try {
      // Update payment reference status to failed
      await fetch("/api/v1/vote/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: reference,
          status: "failed",
          message: response.message || "Payment failed",
        }),
      })

      alert("Payment failed. Please try again.")
    } catch (error) {
      console.error("Error updating payment status:", error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Processing Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#6b2fa5]/10 to-[#9333ea]/10 rounded-xl p-4 border-2 border-[#6b2fa5]/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Amount to Pay</span>
              <span className="text-2xl font-bold text-[#6b2fa5]">₦{amount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Reference: {reference}
            </div>
          </div>

          <div className="flex items-center justify-center py-8">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#6b2fa5]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#6b2fa5] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          <p className="text-center text-slate-600 text-sm">
            Please wait while we initialize your payment...
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 text-sm">
                A secure payment window will open shortly. Please complete your payment to proceed with voting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}