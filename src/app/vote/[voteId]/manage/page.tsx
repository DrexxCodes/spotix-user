"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { auth } from "@/app/lib/firebase"
import { getPollDetails, type VoteData } from "@/app/lib/voting-utils"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import Link from "next/link"

export default function ManagePollPage() {
  const [user, setUser] = useState<any>(null)
  const [poll, setPoll] = useState<VoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const voteId = params.voteId as string

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login")
        return
      }

      setUser(currentUser)

      const pollData = await getPollDetails(currentUser.uid, voteId)
      if (pollData) {
        setPoll(pollData)
      } else {
        router.push("/vote")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [voteId, router])

  if (loading || !poll) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg"></div>
            <p className="text-foreground/70 font-medium">Loading poll details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const totalEarnings = poll.pollCount * poll.pollPrice
  const contestants = poll.contestants || []

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <UserHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <Link 
            href="/vote" 
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Polls
          </Link>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {poll.pollName}
            </h1>
            <p className="text-slate-600 mt-2">Manage and track your poll performance</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white/90">Total Earnings</div>
              <svg className="w-8 h-8 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-white mb-1">₦{totalEarnings.toLocaleString()}</div>
            <div className="text-sm text-white/80 font-medium">
              {poll.pollCount} votes × ₦{poll.pollPrice}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Total Votes</div>
              <svg className="w-8 h-8 text-blue-500/30" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-slate-900">{poll.pollCount}</div>
            <div className="text-sm text-slate-500 font-medium mt-1">Cast so far</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Price Per Vote</div>
              <svg className="w-8 h-8 text-purple-500/30" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-slate-900">₦{poll.pollPrice}</div>
            <div className="text-sm text-slate-500 font-medium mt-1">Per single vote</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-600">Contestants</div>
              <svg className="w-8 h-8 text-amber-500/30" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-slate-900">{contestants.length}</div>
            <div className="text-sm text-slate-500 font-medium mt-1">Competing</div>
          </div>
        </div>

        {/* Contestant Results */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Contestant Results</h2>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Live Results</span>
            </div>
          </div>
          {contestants.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-600 font-medium">No contestants added to this poll yet.</p>
              <p className="text-sm text-slate-500 mt-2">Add contestants to start tracking votes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contestants
                .map((contestant) => {
                  const contestantVotes =
                    poll.pollEntries
                      ?.filter((entry) => entry.uid === contestant.contestantId)
                      .reduce((sum, entry) => sum + entry.voteCount, 0) || 0

                  const winPercentage = poll.pollCount > 0 ? (contestantVotes / poll.pollCount) * 100 : 0

                  return { ...contestant, contestantVotes, winPercentage }
                })
                .sort((a, b) => b.contestantVotes - a.contestantVotes)
                .map((contestant, index) => (
                  <div 
                    key={contestant.contestantId} 
                    className="group relative bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    {index === 0 && contestant.contestantVotes > 0 && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Leading
                      </div>
                    )}
                    <div className="flex gap-4 items-start">
                      <div className="relative flex-shrink-0">
                        <img
                          src={contestant.image || "/placeholder.svg"}
                          alt={contestant.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-lg truncate">{contestant.name}</h3>
                            <p className="text-xs text-slate-500 truncate">{contestant.contestantId}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-slate-900 text-lg">{contestant.contestantVotes}</div>
                            <div className="text-xs text-slate-600 font-medium">votes</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Progress</span>
                            <span className="font-bold text-primary">{contestant.winPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out shadow-sm"
                              style={{ width: `${contestant.winPercentage}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Poll Details */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 flex items-center">
            <svg className="w-7 h-7 mr-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Poll Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary uppercase tracking-wide flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Description
              </label>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {poll.pollDescription}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-emerald-600 uppercase tracking-wide flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Start Date & Time
              </label>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-slate-900 font-medium">{poll.pollStartDate}</p>
                <p className="text-emerald-700 text-sm font-semibold mt-1">{poll.pollStartTime}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-rose-600 uppercase tracking-wide flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                End Date & Time
              </label>
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                <p className="text-slate-900 font-medium">{poll.pollEndDate}</p>
                <p className="text-rose-700 text-sm font-semibold mt-1">{poll.pollEndTime}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}