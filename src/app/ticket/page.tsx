import type { Metadata } from "next"
import { Suspense } from "react"
import TicketClient from "./TicketClient"

export const metadata: Metadata = {
  title: "Your Ticket - Spotix",
  description: "Your event ticket details and confirmation",
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading Your Ticket</h2>
        <p className="text-blue-200">Please wait...</p>
      </div>
    </div>
  )
}

export default function TicketPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketClient />
    </Suspense>
  )
}