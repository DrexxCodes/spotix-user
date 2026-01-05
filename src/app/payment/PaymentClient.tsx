"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Wallet,
  CreditCard,
  User,
  Bitcoin,
  CheckCircle,
  Tag,
  X,
  ArrowLeft,
  ShieldCheck,
  Users,
  ChevronDown,
} from "lucide-react"
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import PayWithPaystack from "@/components/PayWithPaystack"

interface PaymentData {
  eventId: string
  eventName: string
  ticketType: string
  ticketPrice: number
  eventCreatorId: string
  eventVenue?: string
  eventType?: string
  eventDate?: string
  eventEndDate?: string
  eventStart?: string
  eventEnd?: string
  stopDate?: string
  bookerName?: string
  bookerEmail?: string
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

interface ReferralData {
  code: string
}

interface ReferralCodeOption {
  code: string
}

interface UserData {
  fullName?: string
  username?: string
  email: string
}

export default function PaymentClient() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const [discountCode, setDiscountCode] = useState("")
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountData, setDiscountData] = useState<DiscountData | null>(null)
  const [discountError, setDiscountError] = useState("")

  const [referralCodes, setReferralCodes] = useState<ReferralCodeOption[]>([])
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralFetching, setReferralFetching] = useState(false)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [referralError, setReferralError] = useState("")
  const [showReferralDropdown, setShowReferralDropdown] = useState(false)

  // Paystack payment state
  const [showPaystackModal, setShowPaystackModal] = useState(false)
  const [paystackReference, setPaystackReference] = useState<string | null>(null)
  const [creatingReference, setCreatingReference] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await fetchUserData(currentUser.uid)
        await fetchWalletData(currentUser.uid)
      } else {
        router.push("/auth/login")
        return
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const loadPaymentData = async () => {
      const storedPaymentData = sessionStorage.getItem("spotix_payment_data")

      if (storedPaymentData) {
        try {
          const parsedData = JSON.parse(storedPaymentData)
          
          // Check if we need to fetch additional event details
          const needsEventDetails = !parsedData.eventVenue || 
                                     !parsedData.eventType || 
                                     !parsedData.eventDate || 
                                     !parsedData.bookerName

          if (needsEventDetails && parsedData.eventCreatorId && parsedData.eventId) {
            const completeData = await fetchEventDetails(parsedData.eventCreatorId, parsedData.eventId, parsedData)
            setPaymentData(completeData)
          } else {
            setPaymentData(parsedData)
          }

          if (parsedData.eventCreatorId && parsedData.eventId) {
            fetchReferralCodes(parsedData.eventCreatorId, parsedData.eventId)
          }

          const storedReferral = sessionStorage.getItem("selected_referral_code")
          if (storedReferral) {
            try {
              const referral = JSON.parse(storedReferral)
              setReferralData(referral)
            } catch (error) {
              console.error("Error parsing stored referral:", error)
            }
          }
        } catch (error) {
          console.error("Error parsing payment data:", error)
          setPaymentData(null)
        }
      } else {
        setPaymentData(null)
      }

      setDataLoading(false)
    }

    if (user) {
      loadPaymentData()
    }
  }, [user])

  const fetchUserData = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData({
          fullName: data.fullName || data.username || "Valued Customer",
          username: data.username,
          email: data.email || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchEventDetails = async (
    creatorId: string, 
    eventId: string, 
    existingData: PaymentData
  ): Promise<PaymentData> => {
    try {
      const eventDocRef = doc(db, "events", creatorId, "userEvents", eventId)
      const eventDoc = await getDoc(eventDocRef)

      if (eventDoc.exists()) {
        const data = eventDoc.data()

        // Get booker details
        const bookerDocRef = doc(db, "users", creatorId)
        const bookerDoc = await getDoc(bookerDocRef)
        let bookerName = "Event Host"
        let bookerEmail = "support@spotix.com.ng"

        if (bookerDoc.exists()) {
          const bookerData = bookerDoc.data()
          bookerName = bookerData.bookerName || bookerData.fullName || "Event Host"
          bookerEmail = bookerData.email || "support@spotix.com.ng"
        }

        // Merge with existing data
        return {
          ...existingData,
          eventVenue: data.eventVenue || existingData.eventVenue || "",
          eventType: data.eventType || existingData.eventType || "",
          eventDate: data.eventDate || existingData.eventDate || "",
          eventEndDate: data.eventEndDate || existingData.eventEndDate || "",
          eventStart: data.eventStart || existingData.eventStart || "",
          eventEnd: data.eventEnd || existingData.eventEnd || "",
          stopDate: data.enableStopDate ? data.stopDate : existingData.stopDate,
          bookerName: bookerName,
          bookerEmail: bookerEmail,
        }
      }

      return existingData
    } catch (error) {
      console.error("Error fetching event details:", error)
      return existingData
    }
  }

  const fetchWalletData = async (userId: string) => {
    try {
      const response = await fetch("/api/v1/iwss", {
        headers: {
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.balance || 0)
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      setWalletBalance(0)
    }
  }

  const fetchReferralCodes = async (eventCreatorId: string, eventId: string) => {
    setReferralFetching(true)
    try {
      const referralsCollectionRef = collection(db, "events", eventCreatorId, "userEvents", eventId, "referrals")
      const snapshot = await getDocs(referralsCollectionRef)

      const referrals: ReferralCodeOption[] = []
      snapshot.forEach((docSnap) => {
        referrals.push({
          code: docSnap.id,
        })
      })

      setReferralCodes(referrals)
    } catch (error) {
      console.error("Error fetching referral codes:", error)
      setReferralError("Failed to load referral codes")
    } finally {
      setReferralFetching(false)
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
      const response = await fetch("/api/v1/discount", {
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
    } catch (error) {
      console.error("Error validating discount:", error)
      setDiscountError("Failed to validate discount code")
      setDiscountData(null)
    } finally {
      setDiscountLoading(false)
    }
  }

  const selectReferral = (code: string) => {
    const selectedReferral: ReferralData = {
      code: code,
    }
    setReferralData(selectedReferral)
    sessionStorage.setItem("selected_referral_code", JSON.stringify(selectedReferral))
    setShowReferralDropdown(false)
    setReferralError("")
  }

  const removeReferral = () => {
    setReferralData(null)
    sessionStorage.removeItem("selected_referral_code")
    setReferralError("")
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

  const createPaymentReference = async () => {
    if (!paymentData || !user || !userData) return null

    setCreatingReference(true)

    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error("Authentication required")
      }

      let discountAmount = 0
      if (discountData) {
        if (discountData.discountType === "percentage") {
          discountAmount = (paymentData.ticketPrice * discountData.discountValue) / 100
        } else {
          discountAmount = discountData.discountValue
        }
      }

      const subtotal = paymentData.ticketPrice - discountAmount
      const transactionFee = paymentData.ticketPrice === 0 ? 0 : 150
      const totalAmount = subtotal + transactionFee

      const response = await fetch("/api/v1/create-pay-ref", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId: paymentData.eventId,
          eventCreatorId: paymentData.eventCreatorId,
          ticketPrice: paymentData.ticketPrice,
          ticketType: paymentData.ticketType,
          totalAmount: totalAmount,
          transactionFee: transactionFee,
          discountCode: discountData?.code || null,
          discountData: discountData || null,
          referralCode: referralData?.code || null,
          referralData: referralData || null,
          eventName: paymentData.eventName,
          eventVenue: paymentData.eventVenue || null,
          eventType: paymentData.eventType || null,
          eventDate: paymentData.eventDate || null,
          eventEndDate: paymentData.eventEndDate || null,
          eventStart: paymentData.eventStart || null,
          eventEnd: paymentData.eventEnd || null,
          stopDate: paymentData.stopDate || null,
          bookerName: paymentData.bookerName || null,
          bookerEmail: paymentData.bookerEmail || null,
          userFullName: userData.fullName || "Valued Customer",
          userEmail: userData.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create payment reference")
      }

      const data = await response.json()
      console.log("Payment reference created:", data.reference)
      return data.reference
    } catch (error) {
      console.error("Error creating payment reference:", error)
      alert(error instanceof Error ? error.message : "Failed to create payment reference")
      return null
    } finally {
      setCreatingReference(false)
    }
  }

  const handleProceedPayment = async () => {
    if (!paymentData || !userData) return

    const paymentDataWithExtras = {
      ...paymentData,
      discountCode: discountData?.code || null,
      discountData: discountData || null,
      referralCode: referralData?.code || null,
      referralData: referralData || null,
      userFullName: userData.fullName || "Valued Customer",
      userEmail: userData.email,
    }

    if (selectedMethod === "paystack") {
      // Create payment reference first
      const reference = await createPaymentReference()
      if (!reference) {
        return // Error already handled
      }

      setPaystackReference(reference)
      
      // Store payment data
      sessionStorage.setItem("paystack_payment_data", JSON.stringify(paymentDataWithExtras))
      
      // Show Paystack modal
      setShowPaystackModal(true)
    } else {
      sessionStorage.setItem("spotix_payment_data", JSON.stringify(paymentDataWithExtras))

      const params = new URLSearchParams({
        eventId: paymentData.eventId,
        eventName: paymentData.eventName,
        ticketType: paymentData.ticketType,
        ticketPrice: paymentData.ticketPrice.toString(),
        eventCreatorId: paymentData.eventCreatorId,
      })

      switch (selectedMethod) {
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
  }

  const handlePaystackSuccess = (reference: string) => {
    console.log("Payment successful, reference:", reference)
    // Redirect to success page
    router.push(`/payment/success?reference=${reference}`)
  }

  const handlePaystackClose = () => {
    setShowPaystackModal(false)
    setPaystackReference(null)
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 text-center max-w-md">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Payment Details</h2>
          <p className="text-gray-600">Please wait while we prepare your checkout...</p>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Session Expired</h2>
          <p className="text-gray-600 mb-6">
            Your payment session has expired or no payment data was found. Please go back to the event page and try
            again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg"
            style={{ background: "#6b2fa5" }}
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

    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
      <UserHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-700 transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Event</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#6b2fa5" }}>
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Secure Checkout</h1>
                <p className="text-gray-600">Choose your preferred payment method</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Event Summary & Discount */}
            <div className="space-y-6">
              {/* Event Summary */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#f3e8ff" }}
                  >
                    <CheckCircle size={16} style={{ color: "#6b2fa5" }} />
                  </div>
                  Order Summary
                </h3>

                <div className="space-y-3">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-sm text-gray-600 mb-1">Event Name</p>
                    <p className="font-bold text-gray-900">{paymentData.eventName}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-sm text-gray-600 mb-1">Ticket Type</p>
                    <p className="font-bold text-gray-900">{paymentData.ticketType}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Ticket Price</span>
                      <span className="font-semibold">₦{formatNumber(paymentData.ticketPrice)}</span>
                    </div>

                    {discountData && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>
                          Discount (
                          {discountData.discountType === "percentage" ? `${discountData.discountValue}%` : "Fixed"})
                        </span>
                        <span>-₦{formatNumber(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-700">
                      <span>Transaction Fee</span>
                      <span className={`font-semibold ${isFreeEvent ? "line-through text-gray-400" : ""}`}>
                        ₦{formatNumber(150)}
                        {isFreeEvent && <span className="ml-2 text-green-600 no-underline text-xs">Waived</span>}
                      </span>
                    </div>

                    <div
                      className="flex justify-between pt-3 border-t border-gray-300 text-lg font-bold"
                      style={{ color: "#6b2fa5" }}
                    >
                      <span>Total Amount</span>
                      <span>₦{formatNumber(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-100">
                    <Tag size={16} className="text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Discount Code</h3>
                </div>

                {discountData ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border-2 border-green-200">
                    <div>
                      <p className="font-bold text-green-700">{discountData.code}</p>
                      <p className="text-sm text-green-600">
                        {discountData.discountType === "percentage"
                          ? `${discountData.discountValue}% off`
                          : `₦${formatNumber(discountData.discountValue)} off`}
                      </p>
                    </div>
                    <button
                      onClick={() => setDiscountData(null)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value)
                          setDiscountError("")
                        }}
                        placeholder="Enter discount code"
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={validateDiscount}
                        disabled={discountLoading || !discountCode.trim()}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                      >
                        {discountLoading ? "Checking..." : "Apply"}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <X size={14} />
                        {discountError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Referral Code */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Referral Code (Optional)</h3>
                </div>

                {referralData ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
                    <div>
                      <p className="font-bold text-blue-700">{referralData.code}</p>
                      <p className="text-sm text-blue-600">Selected</p>
                    </div>
                    <button onClick={removeReferral} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div>
                    {referralFetching ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <span className="ml-2 text-gray-600">Loading referral codes...</span>
                      </div>
                    ) : referralCodes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No referral codes available</p>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowReferralDropdown(!showReferralDropdown)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span className="text-gray-600">Select a referral code...</span>
                          <ChevronDown
                            size={18}
                            className={`transition-transform ${showReferralDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {showReferralDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-10">
                            <div className="max-h-48 overflow-y-auto">
                              {referralCodes.map((referral) => (
                                <button
                                  key={referral.code}
                                  onClick={() => selectReferral(referral.code)}
                                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 font-medium text-gray-700 transition-colors"
                                >
                                  {referral.code}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {referralError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <X size={14} />
                    {referralError}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Payment Methods */}
            <div>
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Select Payment Method</h3>

                <div className="space-y-4">
                  {/* Wallet */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedMethod === "wallet"
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    }`}
                    onClick={() => handlePaymentMethodSelect("wallet")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                        <Wallet className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">My Wallet</h4>
                        <p className="text-sm text-gray-600">Balance: ₦{formatNumber(walletBalance)}</p>
                      </div>
                      {selectedMethod === "wallet" && <CheckCircle className="w-6 h-6" style={{ color: "#6b2fa5" }} />}
                    </div>
                  </div>

                  {/* Paystack */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isFreeEvent
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                        : selectedMethod === "paystack"
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    }`}
                    onClick={() => handlePaymentMethodSelect("paystack")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">
                          Paystack
                          {isFreeEvent && <span className="ml-2 text-xs text-gray-500">(Not Available)</span>}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isFreeEvent ? "Not available for free events" : "Card or bank transfer"}
                        </p>
                      </div>
                      {selectedMethod === "paystack" && !isFreeEvent && (
                        <CheckCircle className="w-6 h-6" style={{ color: "#6b2fa5" }} />
                      )}
                    </div>
                  </div>

                  {/* Agent Pay */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isFreeEvent
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                        : selectedMethod === "agent"
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    }`}
                    onClick={() => handlePaymentMethodSelect("agent")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                        <User className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">
                          Agent Pay
                          {isFreeEvent && <span className="ml-2 text-xs text-gray-500">(Not Available)</span>}
                          {!isFreeEvent && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-semibold">
                              NEW
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isFreeEvent ? "Not available for free events" : "Pay through verified agents"}
                        </p>
                      </div>
                      {selectedMethod === "agent" && !isFreeEvent && (
                        <CheckCircle className="w-6 h-6" style={{ color: "#6b2fa5" }} />
                      )}
                    </div>
                  </div>

                  {/* Bitcoin */}
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedMethod === "bitcoin"
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-sm"
                    }`}
                    onClick={() => handlePaymentMethodSelect("bitcoin")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                        <Bitcoin className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">Bitcoin</h4>
                        <p className="text-sm text-gray-600">Pay with cryptocurrency</p>
                      </div>
                      {selectedMethod === "bitcoin" && <CheckCircle className="w-6 h-6" style={{ color: "#6b2fa5" }} />}
                    </div>
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  onClick={handleProceedPayment}
                  disabled={!selectedMethod || creatingReference}
                  className="w-full mt-6 py-4 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ background: "#6b2fa5" }}
                >
                  {creatingReference ? (
                    "Processing..."
                  ) : (
                    <>
                      Proceed with{" "}
                      {selectedMethod === "wallet"
                        ? "Wallet Payment"
                        : selectedMethod === "paystack"
                          ? "Paystack"
                          : selectedMethod === "agent"
                            ? "Agent Pay"
                            : selectedMethod === "bitcoin"
                              ? "Bitcoin"
                              : "Payment"}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Paystack Payment Modal */}
      {showPaystackModal && paystackReference && user && (
        <PayWithPaystack
          email={user.email || ""}
          amount={totalAmount}
          reference={paystackReference}
          metadata={{
            eventId: paymentData.eventId,
            eventName: paymentData.eventName,
            ticketType: paymentData.ticketType,
            ticketPrice: paymentData.ticketPrice,
            eventCreatorId: paymentData.eventCreatorId,
            userId: user.uid,
            discountCode: discountData?.code || null,
            referralCode: referralData?.code || null,
          }}
          onSuccess={handlePaystackSuccess}
          onClose={handlePaystackClose}
        />
      )}

      <Footer />
    </div>
  )
}