"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { getPollStatus, type VoteData, type ContestantData } from "@/app/lib/voting-utils"
import { Crown, Maximize2, X } from "lucide-react"
import AddonModal from "./addon"
import PayWithMonnify from "./PayWithMonnify"

interface PollClientProps {
  pollData: VoteData
  voteId: string
  userId?: string | null
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

interface FullscreenModalProps {
  contestant: ContestantData | null
  onClose: () => void
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date().getTime()
  const target = targetDate.getTime()
  const total = target - now

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds, total }
}

function FullscreenModal({ contestant, onClose }: FullscreenModalProps) {
  if (!contestant) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="max-w-4xl w-full">
        <img
          src={contestant.image}
          alt={contestant.name}
          className="w-full h-auto rounded-2xl shadow-2xl"
        />
        <div className="mt-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{contestant.name}</h2>
          <p className="text-white/70 font-mono text-sm">{contestant.contestantId}</p>
        </div>
      </div>
    </div>
  )
}

export default function PollClient({ pollData, voteId, userId }: PollClientProps) {
  const [selectedContestant, setSelectedContestant] = useState<ContestantData | null>(null)
  const [fullscreenContestant, setFullscreenContestant] = useState<ContestantData | null>(null)
  const [showAddonModal, setShowAddonModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState(1)
  const [userDetails, setUserDetails] = useState<{ name: string; email: string } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ 
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 
  })

  const pollStatus = useMemo(
    () => getPollStatus(pollData.pollStartDate, pollData.pollStartTime, pollData.pollEndDate, pollData.pollEndTime),
    [pollData.pollStartDate, pollData.pollStartTime, pollData.pollEndDate, pollData.pollEndTime],
  )

  const targetDate = useMemo(() => {
    if (pollStatus === "notStarted") {
      return new Date(`${pollData.pollStartDate}T${pollData.pollStartTime}`)
    } else if (pollStatus === "active") {
      return new Date(`${pollData.pollEndDate}T${pollData.pollEndTime}`)
    }
    return null
  }, [pollStatus, pollData.pollStartDate, pollData.pollStartTime, pollData.pollEndDate, pollData.pollEndTime])

  useEffect(() => {
    if (!targetDate) return

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(targetDate))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  const contestants = pollData.contestants || []
  const isActive = pollStatus === "active"

  // Find contestant with highest votes (only when poll has ended)
  const highestVoteContestant = useMemo(() => {
    if (pollStatus !== "ended" || contestants.length === 0) return null
    
    return contestants.reduce((highest, current) => {
      const currentVotes = (current as any).votes || 0
      const highestVotes = (highest as any).votes || 0
      return currentVotes > highestVotes ? current : highest
    }, contestants[0])
  }, [contestants, pollStatus])

  const handleVoteClick = (contestant: ContestantData) => {
    if (!isActive) return
    setSelectedContestant(contestant)
    setShowAddonModal(true)
  }

  const handleAddonComplete = async (details: { name?: string; email?: string; voteCount: number }) => {
    setVoteCount(details.voteCount)
    if (details.name && details.email) {
      setUserDetails({ name: details.name, email: details.email })
    }
    
    // Create payment reference
    try {
      const response = await fetch("/api/vote/payref", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { Authorization: `Bearer ${await getUserToken()}` } : {}),
        },
        body: JSON.stringify({
          voteId,
          creatorId: pollData.creatorId,
          contestantId: selectedContestant?.contestantId,
          contestantName: selectedContestant?.name,
          pollPrice: pollData.pollPrice,
          voteCount: details.voteCount,
          totalAmount: pollData.pollPrice * details.voteCount,
          pollName: pollData.pollName,
          userId: userId || null,
          guestName: details.name || null,
          guestEmail: details.email || null,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setPaymentReference(data.reference)
        setShowAddonModal(false)
        setShowPayment(true)
      } else {
        alert("Failed to create payment reference. Please try again.")
      }
    } catch (error) {
      console.error("Error creating payment reference:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const getUserToken = async () => {
    const { auth } = await import("@/app/lib/firebase")
    const user = auth.currentUser
    return user ? await user.getIdToken() : null
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  return (
    <>
      {/* Header Section */}
      <div className="mb-8 space-y-4">
        <Link
          href="/vote"
          className="inline-flex items-center text-[#6b2fa5] hover:text-[#5a1f8a] font-medium transition-colors group"
        >
          <svg
            className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Polls
        </Link>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl overflow-hidden">
          {/* Poll Image */}
          <div className="mb-6 h-48 sm:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
            <img
              src={pollData.pollImage || "/placeholder.svg"}
              alt={pollData.pollName}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Poll Info */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-[#6b2fa5] to-[#9333ea] bg-clip-text text-transparent">
            {pollData.pollName}
          </h1>
          <p className="text-slate-600 mt-2 mb-6 leading-relaxed">{pollData.pollDescription}</p>

          {/* Status and Stats */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all duration-300 flex items-center gap-2 ${
                isActive
                  ? "bg-gradient-to-r from-green-400 to-green-600 text-white animate-pulse"
                  : pollStatus === "ended"
                    ? "bg-gradient-to-r from-red-400 to-red-600 text-white"
                    : "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-white/70'}`} />
              {pollStatus === "active" ? "Live" : pollStatus === "ended" ? "Ended" : "Upcoming"}
            </span>
            <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold shadow-md">
              ₦{pollData.pollPrice.toLocaleString()} per vote
            </span>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      {pollStatus !== "ended" && targetDate && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#6b2fa5] to-[#9333ea] rounded-2xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-white text-xl sm:text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pollStatus === "notStarted" ? "Voting Starts In" : "Voting Ends In"}
            </h2>
            
            <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
              {/* Days */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  {formatNumber(timeRemaining.days)}
                </div>
                <div className="text-xs sm:text-sm text-white/80 font-semibold uppercase tracking-wider">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  {formatNumber(timeRemaining.hours)}
                </div>
                <div className="text-xs sm:text-sm text-white/80 font-semibold uppercase tracking-wider">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  {formatNumber(timeRemaining.minutes)}
                </div>
                <div className="text-xs sm:text-sm text-white/80 font-semibold uppercase tracking-wider">
                  Minutes
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  {formatNumber(timeRemaining.seconds)}
                </div>
                <div className="text-xs sm:text-sm text-white/80 font-semibold uppercase tracking-wider">
                  Seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message for Ended Polls */}
      {pollStatus === "ended" && (
        <div className="mb-8 p-6 rounded-2xl border-l-4 bg-gradient-to-r from-red-50 to-red-100 border-red-500 shadow-lg">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-red-900 text-lg">This poll has ended</p>
              <p className="text-red-700 text-sm mt-1">Voting is no longer available for this poll</p>
            </div>
          </div>
        </div>
      )}

      {/* Contestants Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Cast Your Vote
        </h2>
        <p className="text-slate-600">
          {isActive 
            ? "Select your favorite contestant below" 
            : pollStatus === "notStarted"
              ? "Contestants will be available when voting starts"
              : "View the final standings"
          }
        </p>
      </div>

      {/* Contestants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contestants.map((contestant: ContestantData) => {
          const isHighest = pollStatus === "ended" && highestVoteContestant?.contestantId === contestant.contestantId
          const contestantVotes = (contestant as any).votes || 0
          
          return (
            <div
              key={contestant.contestantId}
              className="rounded-2xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-[1.02] border-slate-200 hover:border-slate-300 bg-white/80 hover:bg-white hover:shadow-xl"
            >
              {/* Contestant Image */}
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                <img
                  src={contestant.image || "/placeholder.svg?height=224&width=400&query=contestant"}
                  alt={contestant.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                
                {/* Highest Vote Badge - Only shown when poll has ended */}
                {isHighest && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                    <Crown className="w-4 h-4" />
                    <span className="text-xs font-bold">Highest Vote</span>
                  </div>
                )}

                {/* Fullscreen Button */}
                <button
                  onClick={() => setFullscreenContestant(contestant)}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Contestant Info */}
              <div className="p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 line-clamp-1">
                  {contestant.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-mono break-all bg-slate-50 px-2 py-1 rounded">
                  {contestant.contestantId}
                </p>

                {/* Show votes only when poll has ended */}
                {pollStatus === "ended" && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-[#6b2fa5]/10 to-[#9333ea]/10 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">Total Votes</p>
                    <p className="text-2xl font-bold text-[#6b2fa5]">{contestantVotes.toLocaleString()}</p>
                  </div>
                )}

                {/* Vote Button */}
                <button
                  onClick={() => handleVoteClick(contestant)}
                  disabled={!isActive}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-[#6b2fa5] to-[#9333ea] text-white hover:shadow-lg hover:shadow-[#6b2fa5]/50 active:scale-95"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  {isActive ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Vote Now
                    </>
                  ) : pollStatus === "notStarted" ? (
                    "Coming Soon"
                  ) : (
                    "Voting Ended"
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {contestants.length === 0 && (
        <div className="text-center py-16 bg-white/50 rounded-2xl backdrop-blur-sm border-2 border-dashed border-slate-300">
          <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-slate-600 font-semibold text-lg mb-2">No contestants yet</p>
          <p className="text-slate-500 text-sm">Contestants will appear here once they're added to the poll</p>
        </div>
      )}

      {/* Modals */}
      <FullscreenModal 
        contestant={fullscreenContestant} 
        onClose={() => setFullscreenContestant(null)} 
      />

      <AddonModal
        isOpen={showAddonModal}
        onClose={() => setShowAddonModal(false)}
        onComplete={handleAddonComplete}
        contestant={selectedContestant}
        pollPrice={pollData.pollPrice}
        isLoggedIn={!!userId}
      />

      {showPayment && paymentReference && (
        <PayWithMonnify
          reference={paymentReference}
          amount={pollData.pollPrice * voteCount}
          email={userDetails?.email || ""}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            alert("Payment successful!")
            setShowPayment(false)
          }}
        />
      )}
    </>
  )
}