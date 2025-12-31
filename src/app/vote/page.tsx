"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/app/lib/firebase"
import {
  getAllUserPolls,
  checkUserVotingProfile,
  createUserVotingProfile,
  getPollStatus,
  type PollStatus,
  type VoteData,
} from "@/app/lib/voting-utils"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import Link from "next/link"
import { Plus, Filter, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"

interface PollWithId {
  id: string
  data: VoteData
}

export default function VotingPage() {
  const [user, setUser] = useState<any>(null)
  const [polls, setPolls] = useState<PollWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [filterStatus, setFilterStatus] = useState<PollStatus | "all">("all")
  const [showWelcome, setShowWelcome] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login")
        return
      }

      setUser(currentUser)

      const hasProfile = await checkUserVotingProfile(currentUser.uid)

      if (!hasProfile) {
        setIsNewUser(true)
        await createUserVotingProfile(currentUser.uid)
        // Trigger welcome animation after a brief delay
        setTimeout(() => setShowWelcome(true), 300)
      } else {
        const userPolls = await getAllUserPolls(currentUser.uid)
        setPolls(userPolls)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const getFilteredPolls = () => {
    if (filterStatus === "all") return polls

    return polls.filter((poll) => {
      const status = getPollStatus(
        poll.data.pollStartDate,
        poll.data.pollStartTime,
        poll.data.pollEndDate,
        poll.data.pollEndTime,
      )
      return status === filterStatus
    })
  }

  const filteredPolls = getFilteredPolls()

  const getStatusStats = () => {
    const stats = {
      all: polls.length,
      active: 0,
      notStarted: 0,
      ended: 0,
    }

    polls.forEach((poll) => {
      const status = getPollStatus(
        poll.data.pollStartDate,
        poll.data.pollStartTime,
        poll.data.pollEndDate,
        poll.data.pollEndTime,
      )
      stats[status]++
    })

    return stats
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 font-medium">Loading your polls...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <UserHeader />
      
      {/* Welcome Dialog with slide-down animation */}
      {isNewUser && polls.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm">
          <div 
            className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all duration-700 ease-out ${
              showWelcome ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
          >
            <div className="relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 opacity-10"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-400 rounded-full blur-3xl opacity-20"></div>
              
              <div className="relative p-8 md:p-12">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-center">
                  Welcome to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Spotix Vote</span>
                </h1>
                
                <p className="text-lg text-slate-600 mb-3 text-center">
                  Create engaging polls and gather insights from your audience in real-time.
                </p>
                
                <p className="text-slate-500 mb-8 text-center">
                  Start by creating your first poll and share the link with your community.
                </p>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Easy Creation</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-pink-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Real-time Results</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Easy Sharing</p>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/vote/create"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all text-center text-lg mb-4"
                >
                  Create Your First Poll
                </Link>

                {/* Terms link */}
                <p className="text-sm text-slate-500 text-center">
                  By continuing, you agree to our{" "}
                  <a
                    href="https://spotix.com.ng/terms/vote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                  >
                    Terms of Service
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {!isNewUser || polls.length > 0 ? (
          <div>
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">Your Polls</h1>
                  <p className="text-slate-600">Manage and track all your voting campaigns</p>
                </div>
                <Link
                  href="/vote/create"
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create New Poll
                </Link>
              </div>

              {/* Stats Cards */}
              {polls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Filter className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
                        <p className="text-xs text-slate-500">Total Polls</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                        <p className="text-xs text-slate-500">Active</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{stats.notStarted}</p>
                        <p className="text-xs text-slate-500">Upcoming</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{stats.ended}</p>
                        <p className="text-xs text-slate-500">Ended</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  filterStatus === "all"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
                onClick={() => setFilterStatus("all")}
              >
                All Polls ({stats.all})
              </button>
              <button
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  filterStatus === "active"
                    ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
                onClick={() => setFilterStatus("active")}
              >
                Active ({stats.active})
              </button>
              <button
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  filterStatus === "notStarted"
                    ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/30"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
                onClick={() => setFilterStatus("notStarted")}
              >
                Upcoming ({stats.notStarted})
              </button>
              <button
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  filterStatus === "ended"
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
                onClick={() => setFilterStatus("ended")}
              >
                Ended ({stats.ended})
              </button>
            </div>

            {/* Polls Grid */}
            {filteredPolls.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-600 text-lg font-medium mb-2">No polls found</p>
                <p className="text-slate-500">Try adjusting your filters or create a new poll</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPolls.map((poll) => {
                  const status = getPollStatus(
                    poll.data.pollStartDate,
                    poll.data.pollStartTime,
                    poll.data.pollEndDate,
                    poll.data.pollEndTime,
                  )
                  return (
                    <Link key={poll.id} href={`/vote/${poll.id}/manage`}>
                      <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col border border-slate-200 group hover:scale-105">
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                          <img
                            src={poll.data.pollImage || "/placeholder.svg"}
                            alt={poll.data.pollName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span
                            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg ${
                              status === "active" 
                                ? "bg-green-500" 
                                : status === "ended" 
                                ? "bg-red-500" 
                                : "bg-yellow-500"
                            }`}
                          >
                            {status === "active" ? "Active" : status === "ended" ? "Ended" : "Upcoming"}
                          </span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {poll.data.pollName}
                          </h3>
                          <div className="flex justify-between items-center mb-4 mt-auto">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Total Votes</p>
                                <p className="text-sm font-bold text-slate-900">{poll.data.pollCount}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Prize Pool</p>
                              <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                ₦{(poll.data.pollAmount || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 space-y-1.5 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Start: {poll.data.pollStartDate} {poll.data.pollStartTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              <span>End: {poll.data.pollEndDate} {poll.data.pollEndTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}