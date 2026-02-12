"use client"

import React from "react"
import { Clock } from "lucide-react"

interface TodayProps {
  todayDate: string
}

const Today: React.FC<TodayProps> = ({ todayDate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #6b2fa5 0%, #8b5cf6 100%)" }}
          >
            <Clock size={28} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Today</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{todayDate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton component
export const TodaySkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Today