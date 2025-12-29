"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageCarouselProps {
  mainImage: string
  additionalImages?: string[]
  eventName: string
}

export function ImageCarousel({ mainImage, additionalImages = [], eventName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const images = [mainImage, ...additionalImages].filter(Boolean)
  const hasMultipleImages = images.length > 1

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setIsLoaded(false)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setIsLoaded(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasMultipleImages) return
    setIsDragging(true)
    setDragStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !hasMultipleImages) return
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    setIsDragging(false)

    const dragEnd = e.clientX
    const dragDistance = dragStart - dragEnd

    if (Math.abs(dragDistance) > 50) {
      if (dragDistance > 0) {
        handleNext()
      } else {
        handlePrevious()
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return
    setIsDragging(true)
    setDragStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return
    setIsDragging(false)

    const dragEnd = e.changedTouches[0].clientX
    const dragDistance = dragStart - dragEnd

    if (Math.abs(dragDistance) > 50) {
      if (dragDistance > 0) {
        handleNext()
      } else {
        handlePrevious()
      }
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-64 md:h-80 mb-8 rounded-lg overflow-hidden shadow-lg group bg-gray-100 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <div className="w-full h-full relative">
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          )}
          <img
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`${eventName} - Image ${currentIndex + 1}`}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true)
              setIsLoaded(true)
            }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {hasError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500">Failed to load image</span>
            </div>
          )}
        </div>

        {/* Fullscreen Button */}
        {isLoaded && !hasError && (
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70 z-10"
          >
            <Maximize2 size={20} />
          </button>
        )}

        {/* Navigation Arrows - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70 z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70 z-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Scroll Indicators - Only show if multiple images */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsLoaded(false)
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-2 h-2 bg-[#6b2fa5]"
                    : "w-1.5 h-1.5 bg-white bg-opacity-60 hover:bg-opacity-100"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute -top-2 -right-2 sm:top-4 sm:right-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full transition-all duration-200 z-20 shadow-lg border-2 border-white/20"
            >
              <X size={24} />
            </button>
            <img
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${eventName} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}
