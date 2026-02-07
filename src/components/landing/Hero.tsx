"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Video, Image as ImageIcon } from "lucide-react"

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)

  const carouselWords = ["Create", "Promote", "Manage", "Sell", "Host"]

  useEffect(() => {
    // Trigger initial animations
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    // Parallax effect on scroll (only for image mode)
    const handleScroll = () => {
      if (!isVideoMode) {
        const scrolled = window.pageYOffset
        const parallaxElement = parallaxRef.current
        
        if (parallaxElement) {
          const speed = 0.5
          parallaxElement.style.transform = `translateY(${scrolled * speed}px)`
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isVideoMode])

  // Handle video play when switching to video mode
  useEffect(() => {
    const video = videoRef.current
    if (isVideoMode && video) {
      const playPromise = video.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoLoaded(true)
          })
          .catch((error) => {
            console.log("Video autoplay prevented:", error)
            setVideoLoaded(true)
          })
      }
    } else if (!isVideoMode && video) {
      video.pause()
    }
  }, [isVideoMode])

  // Text carousel animation
  useEffect(() => {
    const currentWord = carouselWords[currentWordIndex]
    
    if (isWaiting) {
      const waitTimer = setTimeout(() => {
        setIsWaiting(false)
        setCurrentWordIndex((prev) => (prev + 1) % carouselWords.length)
        setIsTyping(true)
        setDisplayedText("")
      }, 1000)
      
      return () => clearTimeout(waitTimer)
    }
    
    if (isTyping) {
      if (displayedText.length < currentWord.length) {
        const typingTimer = setTimeout(() => {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1))
        }, 100)
        
        return () => clearTimeout(typingTimer)
      } else {
        const holdTimer = setTimeout(() => {
          setIsTyping(false)
        }, 5000)
        
        return () => clearTimeout(holdTimer)
      }
    } else {
      if (displayedText.length > 0) {
        const deletingTimer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1))
        }, 80)
        
        return () => clearTimeout(deletingTimer)
      } else {
        setIsWaiting(true)
      }
    }
  }, [displayedText, isTyping, isWaiting, currentWordIndex, carouselWords])

  const toggleBackgroundMode = () => {
    setIsVideoMode(!isVideoMode)
  }

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Parallax */}
      <div 
        ref={parallaxRef}
        className={`absolute inset-0 w-full z-0 will-change-transform transition-opacity duration-700 ${
          isVideoMode ? "opacity-0" : "opacity-100"
        }`}
        style={{ 
          height: "120%", 
          top: "-10%",
        }}
      >
        <Image
          src="/hero.jpg"
          alt="Hero Background"
          fill
          priority
          quality={75}
          className="object-cover"
          sizes="100vw"
        />
      </div>
      
      {/* Full-Screen Video Background */}
      <div className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-700 ${
        isVideoMode ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Enhanced Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75 z-[1]" />
      
      {/* Animated gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#6b2fa5]/20 via-transparent to-purple-600/15 z-[2] animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />
      
      {/* Toggle Button - Right Side Vertically Centered */}
      <button
        onClick={toggleBackgroundMode}
        className="absolute top-1/2 -translate-y-1/2 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg group"
        aria-label={isVideoMode ? "Switch to Image" : "Switch to Video"}
      >
        {isVideoMode ? (
          <>
            <ImageIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Switch to Image</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Switch to Video</span>
          </>
        )}
      </button>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Carousel Title */}
        <div
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 ease-out ${
            isVisible 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-12"
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-4">
            {/* Carousel word with animated gradient */}
            <span 
              className="inline-block min-w-[1ch] bg-gradient-to-r from-[#6b2fa5] via-purple-400 to-[#6b2fa5] bg-clip-text text-transparent drop-shadow-lg"
              style={{
                backgroundSize: "200% 200%",
                animation: "gradient 3s ease infinite"
              }}
            >
              {displayedText}
              <span className="inline-block w-1 h-[0.9em] bg-purple-400 ml-1 animate-pulse" 
                    style={{ verticalAlign: "middle" }} />
            </span>
            
            {/* Placeholder text with text shadow for better visibility */}
            <span className="text-white transition-all duration-200" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
              events with Spotix
            </span>
          </div>
        </div>

        {/* Subtitle with enhanced visibility */}
        <p
          ref={subtitleRef}
          className={`text-lg sm:text-xl md:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ease-out ${
            isVisible 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-12"
          }`}
          style={{ 
            transitionDelay: "300ms",
            textShadow: '1px 1px 6px rgba(0,0,0,0.8)'
          }}
        >
          Your one-stop platform for finding and booking tickets to the most exciting events
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className={`flex flex-col sm:flex-row justify-center items-center gap-4 transition-all duration-1000 ease-out ${
            isVisible 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-12"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <Link
            href="/home"
            className="group relative px-10 py-4 min-w-[200px] bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white rounded-full text-lg font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-[#6b2fa5] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <Link
            href="/auth/signup"
            className="group px-10 py-4 min-w-[200px] bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-full text-lg font-semibold transition-all duration-300 hover:bg-white hover:text-[#6b2fa5] hover:scale-105 hover:shadow-xl"
          >
            Create Events
          </Link>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse z-[2] pointer-events-none" style={{ animationDuration: "3s" }} />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse z-[2] pointer-events-none" style={{ animationDuration: "4s", animationDelay: "1s" }} />

      {/* Loading indicator for video (only show when switching to video mode) */}
      {isVideoMode && !videoLoaded && (
        <div className="absolute inset-0 bg-black/50 z-[3] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">Loading video...</span>
          </div>
        </div>
      )}

      {/* Custom CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  )
}

export default Hero