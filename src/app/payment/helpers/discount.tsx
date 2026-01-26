"use client"

import React from "react"
import { Tag, X } from "lucide-react"

interface DiscountData {
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  maxUses: number
  currentUses: number
  expiryDate: string
}

interface DiscountProps {
  discountCode: string
  setDiscountCode: (code: string) => void
  discountData: DiscountData | null
  setDiscountData: React.Dispatch<React.SetStateAction<DiscountData | null>>
  discountError: string
  setDiscountError: (error: string) => void
  discountLoading: boolean
  onValidateDiscount: () => Promise<void>
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export default function Discount({
  discountCode,
  setDiscountCode,
  discountData,
  setDiscountData,
  discountError,
  setDiscountError,
  discountLoading,
  onValidateDiscount,
}: DiscountProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-4 sm:p-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-100 flex-shrink-0">
          <Tag size={16} className="text-yellow-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Discount Code</h3>
      </div>

      {discountData ? (
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-green-50 border-2 border-green-200">
          <div className="min-w-0 flex-1 pr-2">
            <p className="font-bold text-sm sm:text-base text-green-700 break-words">{discountData.code}</p>
            <p className="text-xs sm:text-sm text-green-600">
              {discountData.discountType === "percentage"
                ? `${discountData.discountValue}% off`
                : `₦${formatNumber(discountData.discountValue)} off`}
            </p>
          </div>
          <button
            onClick={() => setDiscountData(null)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value)
                setDiscountError("")
              }}
              placeholder="Enter discount code"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
            />
            <button
              onClick={onValidateDiscount}
              disabled={discountLoading || !discountCode.trim()}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all w-full sm:w-auto whitespace-nowrap"
            >
              {discountLoading ? "Checking..." : "Apply"}
            </button>
          </div>
          {discountError && (
            <p className="text-red-600 text-xs sm:text-sm mt-2 flex items-center gap-1">
              <X size={14} className="flex-shrink-0" />
              <span className="break-words">{discountError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}