"use client"

import { CheckCircle } from "lucide-react"

interface OrderSummaryProps {
  eventName: string
  ticketType: string
  ticketPrice: number
  vatFee: number
  discountAmount: number
  discountData: {
    code: string
    discountType: "percentage" | "fixed"
    discountValue: number
  } | null
  totalAmount: number
  isFreeEvent: boolean
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export default function OrderSummary({
  eventName,
  ticketType,
  ticketPrice,
  vatFee,
  discountAmount,
  discountData,
  totalAmount,
  isFreeEvent,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-4 sm:p-6 w-full">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#f3e8ff" }}
        >
          <CheckCircle size={16} style={{ color: "#6b2fa5" }} />
        </div>
        <span className="break-words">Order Summary</span>
      </h3>

      <div className="space-y-3">
        <div className="p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Event Name</p>
          <p className="font-bold text-sm sm:text-base text-gray-900 break-words">{eventName}</p>
        </div>

        <div className="p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Ticket Type</p>
          <p className="font-bold text-sm sm:text-base text-gray-900 break-words">{ticketType}</p>
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm sm:text-base text-gray-700">
            <span>Ticket Price</span>
            <span className="font-semibold whitespace-nowrap">
              {isFreeEvent ? "Free" : `₦${formatNumber(ticketPrice)}`}
            </span>
          </div>

          {discountData && !isFreeEvent && (
            <div className="flex justify-between text-sm sm:text-base text-green-600 font-medium">
              <span className="break-words pr-2">
                Discount ({discountData.discountType === "percentage" ? `${discountData.discountValue}%` : "Fixed"})
              </span>
              <span className="whitespace-nowrap">-₦{formatNumber(discountAmount)}</span>
            </div>
          )}

          {!isFreeEvent && (
            <div className="flex justify-between text-sm sm:text-base text-gray-700">
              <span>VAT</span>
              <span className="font-semibold whitespace-nowrap">₦{formatNumber(vatFee)}</span>
            </div>
          )}

          <div
            className="flex justify-between pt-3 border-t border-gray-300 text-base sm:text-lg font-bold"
            style={{ color: "#6b2fa5" }}
          >
            <span>Total Amount</span>
            <span className="whitespace-nowrap">
              {isFreeEvent ? "Free" : `₦${formatNumber(totalAmount)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}