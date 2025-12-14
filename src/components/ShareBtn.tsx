"use client"

import type React from "react"
import { useState } from "react"
import { Share2, Check } from "lucide-react"

interface ShareBtnProps {
  url: string
  title: string
  description?: string
}

const ShareBtn: React.FC<ShareBtnProps> = ({ url, title, description }) => {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
          text: description,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback to copying to clipboard
      try {
        const textToCopy = description ? `${description}` : url
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.log("Error copying to clipboard:", error)
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
    >
      {copied ? (
        <>
          <Check size={16} className="text-green-600" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={16} />
          <span>Share</span>
        </>
      )}
    </button>
  )
}

export default ShareBtn
