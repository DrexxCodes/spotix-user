"use client"

import { useEffect, useState } from "react"
import "./preloader.css"

interface PreloaderProps {
  onLoadingComplete?: () => void
  minDisplayTime?: number // Minimum time to show preloader (ms)
}

export default function Preloader({ onLoadingComplete, minDisplayTime = 5000 }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onLoadingComplete) {
        setTimeout(onLoadingComplete, 500) // Wait for fade out
      }
    }, minDisplayTime)

    return () => clearTimeout(timer)
  }, [minDisplayTime, onLoadingComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#6b2fa5] via-purple-600 to-[#5a2589] animate-in fade-in duration-300">
      <div className="relative">
        {/* Main SPOTIX Text */}
        <svg
          width="600"
          height="200"
          viewBox="0 0 600 200"
          className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient for stroke */}
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="50%" stopColor="#f0e6ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* SPOTIX Text - Fancy serif-style font */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="none"
            stroke="url(#textGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="spotix-text"
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "120px",
              fontWeight: "700",
              letterSpacing: "8px",
              strokeDasharray: 2000,
              strokeDashoffset: 2000,
            }}
          >
            SPOTIX
          </text>
        </svg>

        {/* Animated dots below */}
        <div className="flex items-center gap-2 justify-center mt-8">
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  )
}