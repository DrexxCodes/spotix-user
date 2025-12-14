"use client"

import type React from "react"
import { Heart } from "lucide-react"
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-6">
        {eventData.eventName}
      </h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <ShareBtn url={eventUrl} title={`Join me at ${eventData.eventName}`} description={shareDescription} />
        </div>

        <button
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
            isLiked
              ? "bg-red-100 text-red-600 hover:bg-red-200 border-2 border-red-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300"
          }`}
          onClick={onToggleLike}
          disabled={isLiking}
        >
          <Heart size={20} className={`transition-all ${isLiked ? "fill-current" : ""}`} />
          <span>
            {formatNumber(likeCount)} {likeCount === 1 ? "Like" : "Likes"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-purple-700">Event Type:</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {eventData.eventType}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-green-700">Start Date:</span>
              <span className="text-green-800 font-medium">
                {new Date(eventData.eventDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-700">Start Time:</span>
              <span className="text-blue-800 font-medium">{eventData.eventStart || "Not specified"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border-l-4 border-orange-500">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-orange-700">End Date:</span>
              <span className="text-orange-800 font-medium">
                {eventData.eventEndDate
                  ? new Date(eventData.eventEndDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not specified"}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-l-4 border-indigo-500">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-indigo-700">End Time:</span>
              <span className="text-indigo-800 font-medium">{eventData.eventEnd || "Not specified"}</span>
            </div>
          </div>

          {eventData.enableMaxSize && eventData.maxSize && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-yellow-700">Capacity:</span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800 font-medium">
                    {formatNumber(eventData.ticketsSold || 0)} / {formatNumber(Number.parseInt(eventData.maxSize))}
                  </span>
                  {isSoldOut && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">SOLD OUT</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {eventData.enableColorCode && eventData.colorCode && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-gray-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-700">Event Theme Color:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: eventData.colorCode }}
              ></div>
              <span className="text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                {eventData.colorCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {eventData.eventDescription && (
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></span>
            About This Event
          </h3>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-700 leading-relaxed text-lg mb-6">{eventData.eventDescription}</p>

            <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
              <span className="font-semibold text-gray-700">Agent Activity:</span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  eventData.allowAgents
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-800 border border-gray-300"
                }`}
              >
                {eventData.allowAgents ? "✓ Agents can sell tickets" : "✗ Organizer only"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailsSection
