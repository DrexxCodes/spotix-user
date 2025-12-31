"use client"

import { useState } from "react"
import { X, User, Mail, Hash } from "lucide-react"
import type { ContestantData } from "@/app/lib/voting-utils"

interface AddonModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (details: { name?: string; email?: string; voteCount: number }) => void
  contestant: ContestantData | null
  pollPrice: number
  isLoggedIn: boolean
}

export default function AddonModal({
  isOpen,
  onClose,
  onComplete,
  contestant,
  pollPrice,
  isLoggedIn,
}: AddonModalProps) {
  const [step, setStep] = useState<"details" | "count">(isLoggedIn ? "count" : "details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [voteCount, setVoteCount] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

  if (!isOpen || !contestant) return null

  const validateDetails = () => {
    const newErrors: string[] = []
    if (!name.trim()) newErrors.push("Full name is required")
    if (!email.trim()) newErrors.push("Email is required")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.push("Invalid email format")
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleDetailsNext = () => {
    if (validateDetails()) {
      setStep("count")
      setErrors([])
    }
  }

  const handleComplete = () => {
    if (voteCount < 1) {
      setErrors(["Vote count must be at least 1"])
      return
    }

    onComplete({
      ...(isLoggedIn ? {} : { name, email }),
      voteCount,
    })

    // Reset state
    setStep(isLoggedIn ? "count" : "details")
    setName("")
    setEmail("")
    setVoteCount(1)
    setErrors([])
  }

  const totalAmount = pollPrice * voteCount

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div
        className={`bg-white w-full sm:max-w-lg sm:rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 ${
          step === "details" ? "slide-in-from-bottom" : ""
        }`}
        style={{
          maxHeight: "90vh",
          borderTopLeftRadius: "1.5rem",
          borderTopRightRadius: "1.5rem",
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6b2fa5] to-[#9333ea] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">Vote for {contestant.name}</h2>
          <p className="text-white/80 text-sm">Complete the details to proceed</p>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-700 text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Details Step (for non-logged-in users) */}
          {step === "details" && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Oh-oh, we couldn't find a user session for you</p>
                  <p className="text-yellow-800 text-sm">
                    It means you're not logged in. Just fill these details and you are good to go!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6b2fa5] focus:ring-4 focus:ring-[#6b2fa5]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6b2fa5] focus:ring-4 focus:ring-[#6b2fa5]/10"
                />
              </div>

              <button
                onClick={handleDetailsNext}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#6b2fa5] to-[#9333ea] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          )}

          {/* Vote Count Step */}
          {step === "count" && (
            <div className="space-y-6">
              {/* Contestant Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <img
                  src={contestant.image}
                  alt={contestant.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-bold text-slate-900">{contestant.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{contestant.contestantId}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Number of Votes
                </label>
                
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                    className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xl text-slate-700 transition-colors"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    min="1"
                    value={voteCount}
                    onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 text-center text-2xl font-bold focus:outline-none focus:border-[#6b2fa5] focus:ring-4 focus:ring-[#6b2fa5]/10"
                  />
                  
                  <button
                    onClick={() => setVoteCount(voteCount + 1)}
                    className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xl text-slate-700 transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10].map((count) => (
                    <button
                      key={count}
                      onClick={() => setVoteCount(count)}
                      className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                        voteCount === count
                          ? "bg-[#6b2fa5] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {count} {count === 1 ? "vote" : "votes"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-r from-[#6b2fa5]/10 to-[#9333ea]/10 rounded-xl p-4 border-2 border-[#6b2fa5]/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 font-medium">Price per vote</span>
                  <span className="font-bold text-slate-900">₦{pollPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 font-medium">Number of votes</span>
                  <span className="font-bold text-slate-900">×{voteCount}</span>
                </div>
                <div className="h-px bg-slate-300 my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-bold text-[#6b2fa5]">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isLoggedIn && (
                  <button
                    onClick={() => setStep("details")}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#6b2fa5] to-[#9333ea] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}