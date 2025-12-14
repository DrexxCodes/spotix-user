"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet, CreditCard, User, Bitcoin, CheckCircle, Tag, X } from "lucide-react"
import { auth } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface PaymentData {
  eventId: string
  eventName: string
  ticketType: string
  ticketPrice: number
  eventCreatorId: string
}

interface WalletData {
  balance: number
  currency: string
}

interface DiscountData {
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  maxUses: number
  currentUses: number
  expiryDate: string
}

export default function PaymentClient() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string>("wallet")
  const [loading, setLoading] = useState(true)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [user, setUser] = useState<any>(null)

  const [discountCode, setDiscountCode] = useState("")
  const [discountData, setDiscountData] = useState<DiscountData | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchWalletData(currentUser.uid)
      } else {
        router.push("/auth/login")
        return
      }
    })

    const storedPaymentData = sessionStorage.getItem("spotix_payment_data")
    console.log("[v0] Checking for payment data in sessionStorage:", storedPaymentData)

    if (storedPaymentData) {
      try {
        const parsedData = JSON.parse(storedPaymentData)
        setPaymentData(parsedData)
        console.log("[v0] Payment data loaded successfully:", parsedData)
      } catch (error) {
        console.error("[v0] Error parsing payment data:", error)
        setPaymentData(null)
      }
    } else {
      console.log("[v0] No payment data found in sessionStorage")
      setPaymentData(null)
    }

    setLoading(false)
    return () => unsubscribe()
  }, [router])

  const fetchWalletData = async (userId: string) => {
    try {
      const response = await fetch("/api/wallet", {
        headers: {
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWalletData({
          balance: data.balance || 0,
          currency: "NGN",
        })
        console.log("[v0] Wallet data fetched:", data.balance)
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      setWalletData({ balance: 0, currency: "NGN" })
    }
  }

  const validateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code")
      return
    }

    setDiscountLoading(true)
    setDiscountError("")

    try {
      const response = await fetch("/api/discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          code: discountCode.trim(),
          eventId: paymentData?.eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDiscountError(data.message || "Invalid discount code")
        setDiscountData(null)
        return
      }

      setDiscountData(data)
      setDiscountError("")
      console.log("[v0] Discount validated successfully:", data)
    } catch (error) {
      console.error("[v0] Error validating discount:", error)
      setDiscountError("Failed to validate discount code")
      setDiscountData(null)
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = () => {
    setDiscountData(null)
    setDiscountCode("")
    setDiscountError("")
  }

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handlePaymentMethodSelect = (method: string) => {
    if (!paymentData) return

    const isFreeEvent = paymentData.ticketPrice === 0

    if (isFreeEvent && (method === "paystack" || method === "agent")) {
      return
    }

    setSelectedMethod(method)
  }

  const handleProceedPayment = () => {
    if (!paymentData) return

    const paymentDataWithDiscount = {
      ...paymentData,
      discountCode: discountData?.code || null,
      discountData: discountData || null,
    }

    if (selectedMethod === "paystack") {
      sessionStorage.setItem("paystack_payment_data", JSON.stringify(paymentDataWithDiscount))
    } else {
      sessionStorage.setItem("spotix_payment_data", JSON.stringify(paymentDataWithDiscount))
    }

    const params = new URLSearchParams({
      eventId: paymentData.eventId,
      eventName: paymentData.eventName,
      ticketType: paymentData.ticketType,
      ticketPrice: paymentData.ticketPrice.toString(),
      eventCreatorId: paymentData.eventCreatorId,
    })

    switch (selectedMethod) {
      case "paystack":
        router.push(`/payment/paystack?${params.toString()}`)
        break
      case "wallet":
        router.push(`/payment/wallet?${params.toString()}`)
        break
      case "agent":
        router.push(`/payment/agent?${params.toString()}`)
        break
      case "bitcoin":
        router.push(`/payment/bitcoin?${params.toString()}`)
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Payment Session Expired</h2>
          <p className="text-blue-200 mb-6">
            Your payment session has expired or no payment data was found. Please go back to the event page and try
            again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const isFreeEvent = paymentData.ticketPrice === 0
  const transactionFee = isFreeEvent ? 0 : 150

  let discountAmount = 0
  if (discountData) {
    if (discountData.discountType === "percentage") {
      discountAmount = (paymentData.ticketPrice * discountData.discountValue) / 100
    } else {
      discountAmount = discountData.discountValue
    }
  }

  const subtotal = paymentData.ticketPrice - discountAmount
  const totalAmount = subtotal + transactionFee

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose Payment Method</h1>
          <p className="text-blue-200">Select how you'd like to pay for your ticket</p>
        </div>

        {/* Glass Container */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
          {/* Event Summary */}
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">Event Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-blue-100">
                <span>Event:</span>
                <span className="font-medium">{paymentData.eventName}</span>
              </div>
              <div className="flex justify-between text-blue-100">
                <span>Ticket Type:</span>
                <span className="font-medium">{paymentData.ticketType}</span>
              </div>
              <div className="flex justify-between text-blue-100">
                <span>Ticket Price:</span>
                <span className="font-medium">NGN {formatNumber(paymentData.ticketPrice)}</span>
              </div>

              {discountData && (
                <div className="flex justify-between text-green-300 font-medium">
                  <span>
                    Discount ({discountData.discountType === "percentage" ? `${discountData.discountValue}%` : "Fixed"}
                    ):
                  </span>
                  <span>-NGN {formatNumber(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-blue-100">
                <span>Transaction Fee:</span>
                <span className={`font-medium ${isFreeEvent ? "line-through text-gray-400" : ""}`}>
                  NGN {formatNumber(150)}
                  {isFreeEvent && <span className="ml-2 text-green-400 no-underline">Waived</span>}
                </span>
              </div>
              <div className="flex justify-between text-white font-semibold text-base pt-2 border-t border-white/20">
                <span>Total:</span>
                <span>NGN {formatNumber(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center mb-3">
              <Tag className="w-5 h-5 text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Apply Discount Code</h3>
            </div>

            {discountData ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/20 border border-green-500/50">
                <div>
                  <p className="text-green-300 font-semibold">{discountData.code}</p>
                  <p className="text-sm text-green-200">
                    {discountData.discountType === "percentage"
                      ? `${discountData.discountValue}% off`
                      : `NGN ${formatNumber(discountData.discountValue)} off`}
                  </p>
                </div>
                <button onClick={removeDiscount} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value)
                    setDiscountError("")
                  }}
                  placeholder="Enter discount code"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={validateDiscount}
                  disabled={discountLoading || !discountCode.trim()}
                  className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-300 font-semibold rounded-lg transition-colors"
                >
                  {discountLoading ? "Validating..." : "Apply"}
                </button>
              </div>
            )}

            {discountError && <p className="text-red-300 text-sm mt-2">{discountError}</p>}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>

            {/* Wallet */}
            <div
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedMethod === "wallet"
                  ? "border-blue-400 bg-blue-500/20"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => handlePaymentMethodSelect("wallet")}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Wallet className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">My Wallet</h4>
                  <p className="text-sm text-blue-200">
                    Balance: NGN {walletData ? formatNumber(walletData.balance) : "0"}
                  </p>
                </div>
                {selectedMethod === "wallet" && <CheckCircle className="w-5 h-5 text-blue-400" />}
              </div>
            </div>

            {/* Paystack */}
            <div
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isFreeEvent
                  ? "border-gray-600 bg-gray-500/10 cursor-not-allowed opacity-50"
                  : selectedMethod === "paystack"
                    ? "border-blue-400 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => handlePaymentMethodSelect("paystack")}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">
                    Paystack
                    {isFreeEvent && <span className="ml-2 text-xs text-gray-400">(Not Available)</span>}
                  </h4>
                  <p className="text-sm text-blue-200">
                    {isFreeEvent ? "Not available for free events" : "Pay with card or bank transfer"}
                  </p>
                </div>
                {selectedMethod === "paystack" && !isFreeEvent && <CheckCircle className="w-5 h-5 text-blue-400" />}
              </div>
            </div>

            {/* Agent Pay */}
            <div
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isFreeEvent
                  ? "border-gray-600 bg-gray-500/10 cursor-not-allowed opacity-50"
                  : selectedMethod === "agent"
                    ? "border-blue-400 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => handlePaymentMethodSelect("agent")}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-orange-500/20">
                  <User className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">
                    Agent Pay
                    {isFreeEvent && <span className="ml-2 text-xs text-gray-400">(Not Available)</span>}
                    {!isFreeEvent && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">NEW</span>
                    )}
                  </h4>
                  <p className="text-sm text-blue-200">
                    {isFreeEvent ? "Not available for free events" : "Pay through our verified agents"}
                  </p>
                </div>
                {selectedMethod === "agent" && !isFreeEvent && <CheckCircle className="w-5 h-5 text-blue-400" />}
              </div>
            </div>

            {/* Bitcoin */}
            <div
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedMethod === "bitcoin"
                  ? "border-blue-400 bg-blue-500/20"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => handlePaymentMethodSelect("bitcoin")}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Bitcoin className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">Bitcoin</h4>
                  <p className="text-sm text-blue-200">Pay with cryptocurrency</p>
                </div>
                {selectedMethod === "bitcoin" && <CheckCircle className="w-5 h-5 text-blue-400" />}
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <button
            onClick={handleProceedPayment}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            Proceed with{" "}
            {selectedMethod === "wallet"
              ? "Wallet"
              : selectedMethod === "paystack"
                ? "Paystack"
                : selectedMethod === "agent"
                  ? "Agent Pay"
                  : "Bitcoin"}
          </button>
        </div>
      </div>
    </div>
  )
}
