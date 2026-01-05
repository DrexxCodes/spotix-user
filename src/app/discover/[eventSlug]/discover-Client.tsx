"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DiscoverClientProps {
  eventSlug: string
}

export default function DiscoverClient({ eventSlug }: DiscoverClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveShortlink = async () => {
      if (!eventSlug) {
        setError("No event slug provided")
        setLoading(false)
        return
      }

      try {
        console.log("Resolving shortlink for slug:", eventSlug)

        const response = await fetch(`/api/v1/discover/${eventSlug}`)

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || "Shortlink not found")
          setLoading(false)
          return
        }

        const data = await response.json()
        const { bookerId, eventId } = data

        if (!bookerId || !eventId) {
          setError("Invalid shortlink")
          setLoading(false)
          return
        }

        // Redirect to the actual event page
        console.log(`Redirecting to /event/${bookerId}/${eventId}`)
        router.replace(`/event/${bookerId}/${eventId}`)
      } catch (error) {
        console.error("Error resolving shortlink:", error)
        setError("Failed to resolve shortlink")
        setLoading(false)
      }
    }

    resolveShortlink()
  }, [eventSlug, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>

          <Link
            href="/home"
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return null
}
