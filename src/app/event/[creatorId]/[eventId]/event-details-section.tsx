"use client"

import type React from "react"
import { Heart, Share2, Calendar, Clock, Users, Palette, Info, Check, X, TrendingUp, Award } from "lucide-react"
import { formatNumber } from "@/utils/formatter"
import ShareBtn from "@/components/ShareBtn"

interface EventDetailsTabProps {
  eventData: {
    eventName: string
    eventType: string
    eventDate: string
    eventEndDate: string
    eventStart: string
    eventEnd: string
    enableMaxSize?: boolean
    maxSize?: string
    ticketsSold?: number
    enableColorCode?: boolean
    colorCode?: string
    eventDescription?: string
    allowAgents?: boolean
  }
  eventUrl: string
  isLiked: boolean
  likeCount: number
  isLiking: boolean
  isSoldOut: boolean
  onToggleLike: () => void
}

const EventDetailsSection: React.FC<EventDetailsTabProps> = ({
  eventData,
  eventUrl,
  isLiked,
  likeCount,
  isLiking,
  isSoldOut,
  onToggleLike,
}) => {
  const shareDescription = `Hey, I saw this event on Spotix and I thought you might be interested too! Have a look at it here: ${eventUrl}`

  // Calculate capacity percentage
  const getCapacityPercentage = () => {
    if (!eventData.enableMaxSize || !eventData.maxSize) return 0
    const sold = eventData.ticketsSold || 0
    const max = Number.parseInt(eventData.maxSize)
    return Math.round((sold / max) * 100)
  }

  const capacityPercentage = getCapacityPercentage()
  const isHighDemand = capacityPercentage >= 75 && capacityPercentage < 100
  const isAlmostFull = capacityPercentage >= 90 && capacityPercentage < 100

  return (
    <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Gradient Banner */}
      <div className="bg-gradient-to-r from-[#6b2fa5] via-purple-600 to-[#6b2fa5] p-6 md:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
              {eventData.eventName}
            </h1>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white px-4 py-2 rounded-full shadow-lg">
              <Award size={18} />
              <span className="font-bold text-sm md:text-base">{eventData.eventType}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ShareBtn url={eventUrl} title={`Join me at ${eventData.eventName}`} description={shareDescription} />
          </div>

          <button
            className={`group flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold shadow-lg transform hover:scale-105 ${
              isLiked
                ? "bg-white text-red-600 hover:bg-red-50 border-2 border-white"
                : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-2 border-white/30"
            }`}
            onClick={onToggleLike}
            disabled={isLiking}
          >
            <Heart 
              size={20} 
              className={`transition-all ${isLiked ? "fill-current animate-pulse" : "group-hover:scale-110"}`} 
            />
            <span>
              {formatNumber(likeCount)} {likeCount === 1 ? "Like" : "Likes"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8 space-y-8">

        {/* Date & Time Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Start Date & Time */}
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">Event Start</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(eventData.eventDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time</p>
                  <p className="text-sm font-bold text-gray-900">{eventData.eventStart || "Not specified"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* End Date & Time */}
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">Event End</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {eventData.eventEndDate
                      ? new Date(eventData.eventEndDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time</p>
                  <p className="text-sm font-bold text-gray-900">{eventData.eventEnd || "Not specified"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Section */}
        {eventData.enableMaxSize && eventData.maxSize && (
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#6b2fa5] to-purple-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Event Capacity</h3>
                </div>
                {isSoldOut && (
                  <span className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    <X size={12} />
                    SOLD OUT
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tickets Sold</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(eventData.ticketsSold || 0)} / {formatNumber(Number.parseInt(eventData.maxSize))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fill Rate</p>
                  <p className={`text-3xl font-bold ${
                    isSoldOut ? "text-red-600" : isAlmostFull ? "text-orange-600" : isHighDemand ? "text-yellow-600" : "text-purple-600"
                  }`}>
                    {capacityPercentage}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSoldOut
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : isAlmostFull
                        ? "bg-gradient-to-r from-orange-500 to-red-500"
                        : isHighDemand
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-[#6b2fa5] to-purple-600"
                    }`}
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
                {isHighDemand && !isSoldOut && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-semibold flex items-center gap-2">
                      <TrendingUp size={16} className="text-yellow-600" />
                      High Demand! {100 - capacityPercentage}% of tickets remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Color Code Section */}
        {eventData.enableColorCode && eventData.colorCode && (
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Palette size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Theme</p>
                  <p className="text-sm font-bold text-gray-900">Custom Color Code</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-xl border-4 border-white shadow-lg ring-2 ring-gray-200"
                  style={{ backgroundColor: eventData.colorCode }}
                />
                <span className="text-lg font-mono font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                  {eventData.colorCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Event Description */}
        {eventData.eventDescription && (
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#6b2fa5] to-purple-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Info size={16} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">About This Event</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">
                  {eventData.eventDescription}
                </p>
              </div>

              {/* Agent Activity */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <h4 className="font-bold text-gray-900">Ticket Sales</h4>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        eventData.allowAgents ? "bg-green-100" : "bg-gray-100"
                      }`}>
                        {eventData.allowAgents ? (
                          <Check size={20} className="text-green-600" />
                        ) : (
                          <X size={20} className="text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent Status</p>
                        <p className="text-sm font-bold text-gray-900">
                          {eventData.allowAgents ? "Authorized Agents Enabled" : "Organizer Only"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                        eventData.allowAgents
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {eventData.allowAgents ? (
                        <>
                          <Check size={14} />
                          Agents Can Sell
                        </>
                      ) : (
                        <>
                          <X size={14} />
                          Restricted
                        </>
                      )}
                    </span>
                  </div>
                  {eventData.allowAgents && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800 leading-relaxed">
                        This event allows authorized agents to sell tickets on behalf of the organizer, making it easier to reach more attendees.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventDetailsSection