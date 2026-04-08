"use client"

import { useState } from "react"
import { X, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import FaceMarker from "./FaceMarker"

interface FaceEmbeddingModalProps {
  isOpen: boolean
  ticketId: string
  eventId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function FaceEmbeddingModal({
  isOpen,
  ticketId,
  eventId,
  onClose,
  onSuccess,
}: FaceEmbeddingModalProps) {
  const [embedding, setEmbedding] = useState<number[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEmbeddingComplete = async (embeddingData: number[]) => {
    setEmbedding(embeddingData)
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/ticket/${ticketId}/embedding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embedding: embeddingData,
          eventId,
          ticketId,
        }),
      })

      if (response.status === 401) {
        setError("You must be logged in to save your face embedding.")
        setIsProcessing(false)
        return
      }

      if (response.status === 403) {
        setError("You don't have permission to save an embedding for this ticket.")
        setIsProcessing(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || "Failed to save face embedding. Please try again.")
        setIsProcessing(false)
        return
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 2000)
      } else {
        setError(data.message || "Failed to save face embedding.")
        setIsProcessing(false)
      }
    } catch (err) {
      console.error("[v0] Error saving embedding:", err)
      setError("An error occurred while saving your face embedding.")
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Generate Face Embedding</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Embedding Saved!</h3>
              <p className="text-gray-600 text-center">
                Your face embedding has been successfully saved to your ticket.
              </p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    setEmbedding(null)
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How to Generate Your Face Embedding
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600 min-w-fit">1.</span>
                    <span>Allow camera access when prompted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600 min-w-fit">2.</span>
                    <span>Position your face clearly in the frame</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600 min-w-fit">3.</span>
                    <span>Keep your face still while the system detects landmarks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600 min-w-fit">4.</span>
                    <span>The system will display your eye, nose, mouth, and ear landmarks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600 min-w-fit">5.</span>
                    <span>Once detected, click "Confirm & Save Embedding" to save</span>
                  </li>
                </ul>
              </div>

              <FaceMarker
                onEmbeddingComplete={handleEmbeddingComplete}
                isProcessing={isProcessing}
              />

              {isProcessing && embedding && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-purple-600 mr-2" size={20} />
                  <span className="text-gray-600">Saving your face embedding...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
