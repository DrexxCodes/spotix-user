"use client"

import type React from "react"
import { X, Ticket, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/utils/formatter"

interface TicketType {
  policy: string
  price: number
  description?: string
  availableTickets?: number
  soldTickets?: number
}

interface BuyTicketDialogProps {
  eventData: {
    isFree: boolean
    ticketPrices?: TicketType[]
    enableStopDate?: boolean
    stopDate?: string
  }
  isEventToday: boolean
  isEventPassed: boolean
  isSoldOut: boolean
  isSaleEnded: boolean
  onBuyTicket: (ticketType: string, ticketPrice: number | string) => void
  onClose: () => void
  onShowPassedDialog: () => void
}

const BuyTicketDialog: React.FC<BuyTicketDialogProps> = ({
  eventData,
  isEventToday,
  isEventPassed,
  isSoldOut,
  isSaleEnded,
  onBuyTicket,
  onClose,
  onShowPassedDialog,
}) => {
  // Check if a specific ticket type is sold out
  const isTicketTypeSoldOut = (ticket: TicketType) => {
    if (!ticket.availableTickets) return false
    const soldCount = ticket.soldTickets || 0
    return soldCount >= ticket.availableTickets
  }

  // Get remaining tickets for a ticket type
  const getRemainingTickets = (ticket: TicketType) => {
    if (!ticket.availableTickets) return null
    const soldCount = ticket.soldTickets || 0
    return Math.max(0, ticket.availableTickets - soldCount)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] shadow-xl my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-lg flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Select Tickets</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Added proper scrolling with padding for mobile and desktop */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Messages */}
          {isEventToday && !isEventPassed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">🔥 Event is happening today! Grab your tickets now</p>
            </div>
          )}

          {isSoldOut && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 font-medium">❌ This event is sold out! No more tickets are available.</p>
            </div>
          )}

          {isSaleEnded && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⏰ Ticket sales have ended for this event.</p>
            </div>
          )}

          {isEventPassed && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 font-medium">📅 This event has already taken place.</p>
            </div>
          )}

          {eventData.enableStopDate && eventData.stopDate && !isSaleEnded && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Ticket sales end on:</strong> {new Date(eventData.stopDate).toLocaleString()}
              </p>
            </div>
          )}

          {/* Tickets */}
          {eventData.isFree ? (
            <div className="text-center py-8">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <Ticket size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Free Event</h3>
                <p className="text-green-700 mb-4">This is a free event - no payment required!</p>

                {isEventPassed ? (
                  <button
                    onClick={() => {
                      onClose()
                      onShowPassedDialog()
                    }}
                    className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                    disabled
                  >
                    Event Passed
                  </button>
                ) : (
                  <button
                    onClick={() => onBuyTicket("Free Admission", 0)}
                    disabled={isSoldOut || isSaleEnded}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isEventToday ? "Get Tickets Today" : "Get Free Ticket"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Available Tickets:</h3>

              {Array.isArray(eventData.ticketPrices) && eventData.ticketPrices.length > 0 ? (
                <div className="space-y-4">
                  {eventData.ticketPrices.map((ticket, index) => {
                    const isThisTicketSoldOut = isTicketTypeSoldOut(ticket)
                    const remainingTickets = getRemainingTickets(ticket)
                    const isLowStock = remainingTickets !== null && remainingTickets <= 10 && remainingTickets > 0

                    return (
                      <div
                        key={index}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isThisTicketSoldOut
                            ? "border-gray-200 bg-gray-50 opacity-60"
                            : "border-purple-200 bg-purple-50 hover:border-purple-300"
                        }`}
                      >
                        {/* Ticket Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800">{ticket.policy}</h4>
                            {ticket.description && <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>}
                          </div>
                          <div className="text-right">
                            {ticket.price === 0 ? (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">FREE</span>
                            ) : (
                              <span className="text-2xl font-bold text-purple-600">
                                {formatCurrency(Number.parseFloat(String(ticket.price)))}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Availability Info */}
                        {remainingTickets !== null && (
                          <div
                            className={`flex items-center gap-2 mb-3 text-sm ${
                              isLowStock ? "text-yellow-600" : "text-gray-600"
                            }`}
                          >
                            <Ticket size={14} />
                            <span>
                              {isThisTicketSoldOut ? (
                                <span className="text-red-600 font-medium">Sold Out</span>
                              ) : (
                                <>
                                  {formatNumber(remainingTickets)} of {formatNumber(ticket.availableTickets!)} remaining
                                  {isLowStock && <AlertTriangle size={14} className="inline ml-1" />}
                                </>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Low Stock Warning */}
                        {isLowStock && !isThisTicketSoldOut && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-yellow-600" />
                            <span className="text-yellow-800 text-sm font-medium">
                              Only {remainingTickets} tickets left!
                            </span>
                          </div>
                        )}

                        {/* Buy Button */}
                        <div className="flex justify-end">
                          {isEventPassed ? (
                            <button
                              onClick={() => {
                                onClose()
                                onShowPassedDialog()
                              }}
                              className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                              disabled
                            >
                              Event Passed
                            </button>
                          ) : (
                            <button
                              onClick={() => onBuyTicket(ticket.policy, ticket.price)}
                              disabled={isSoldOut || isSaleEnded || isThisTicketSoldOut}
                              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                isThisTicketSoldOut || isSoldOut || isSaleEnded
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "bg-purple-600 text-white hover:bg-purple-700"
                              }`}
                            >
                              {isThisTicketSoldOut ? "Sold Out" : isEventToday ? "Get Tickets Today" : "Buy Ticket"}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No ticket pricing information available for this event.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-lg flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            Secure payment processing • All transactions are encrypted
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuyTicketDialog
