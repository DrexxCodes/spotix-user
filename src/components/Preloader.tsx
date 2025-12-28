"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Wait for window to fully load
    const handleLoad = () => {
      // Start fade out animation
      setFadeOut(true)
      
      // Remove preloader after animation completes
      setTimeout(() => {
        setIsLoading(false)
      }, 500) // Match this with animation duration
    }

    // Check if page is already loaded
    if (document.readyState === "complete") {
      handleLoad()
    } else {
      window.addEventListener("load", handleLoad)
    }

    // Fallback: Remove preloader after 3 seconds even if load event doesn't fire
    const fallbackTimeout = setTimeout(() => {
      handleLoad()
    }, 3000)

    return () => {
      window.removeEventListener("load", handleLoad)
      clearTimeout(fallbackTimeout)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#6b2fa5] via-purple-600 to-purple-800 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
      
      {/* Preloader content */}
      <div className="relative flex flex-col items-center space-y-6">
        {/* Preloader GIF */}
        <div className="relative w-32 h-32">
          <Image
            src="/preloader.gif"
            alt="Loading..."
            fill
            className="object-contain"
            priority
            unoptimized // Keep GIF animated
          />
        </div>
      </div>
    </div>
  )
}

export default Preloader