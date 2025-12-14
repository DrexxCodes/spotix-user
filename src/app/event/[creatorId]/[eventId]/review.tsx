"use client"

import type React from "react"
import { useState } from "react"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../../lib/firebase"
import { Star } from "lucide-react"

interface ReviewProps {
  eventId: string
  eventName: string
}

const Review: React.FC<ReviewProps> = ({ eventId, eventName }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    const user = auth.currentUser
    if (!user || rating === 0) return

    setSubmitting(true)
    try {
      const reviewRef = doc(db, "eventReviews", eventId, "reviews", user.uid)
      await setDoc(reviewRef, {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        rating,
        comment,
        createdAt: serverTimestamp(),
      })

      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 mb-2">✅</div>
        <h4 className="font-medium text-green-800 mb-1">Review Submitted!</h4>
        <p className="text-green-700 text-sm">Thank you for your feedback about {eventName}.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h4 className="font-semibold text-gray-800 mb-4">Leave a Review</h4>

      <form onSubmit={handleSubmitReview} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rate this event</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star size={24} className={star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"} />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience about this event..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  )
}

export default Review
