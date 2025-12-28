"use client"

import { useState, useEffect } from "react"
import Preloader from "@/components/Preloader"
import Snowfall from 'react-snowfall'
import Navbar from "@/components/landing/NavBar"
import Hero from "@/components/landing/Hero"
import Events from "@/components/landing/Events"
import HowItWorks from "@/components/landing/HowItWorks"
import Features from "@/components/landing/Features"
import Creators from "@/components/landing/Creators"
import BookerCTA from "@/components/landing/BookerCTA"
import {Footer} from "@/components/landing/footer"

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Set loaded state after a brief delay to ensure preloader shows
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Preloader */}
      <Preloader />

      {/* Main Content */}
      <div className={`min-h-screen transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        {/* Navbar */}
        <Navbar />

        {/* Hero Section */}
         <Hero />
         <Snowfall
         color="white"
          />

        {/* Events Section */}
        <Events />

          
        {/* How It Works Section */}
        <HowItWorks />

        {/* Features Section */}
        <Features />

        {/* Creators Section */}
        <Creators />

        {/* Booker CTA Section */}
        <BookerCTA />

        {/* Footer */}
        <Footer />
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #6b2fa5;
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #5a2589;
        }
      `}</style>
    </>
  )
}