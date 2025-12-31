"use client"

import { useEffect } from "react"
import { auth } from "@/app/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

declare global {
  interface Window {
    Tawk_API?: any
    Tawk_LoadStart?: Date
  }
}

export default function TawkToChat() {
  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById("tawk-script")) {
      return
    }

    // Create and load Tawk.to script
    const script = document.createElement("script")
    script.id = "tawk-script"
    script.async = true
    script.src = "https://embed.tawk.to/67f231fc2dd176190b3b2db3/1io516hc0"
    script.charset = "UTF-8"
    script.setAttribute("crossorigin", "*")

    // Set load start time
    window.Tawk_LoadStart = new Date()

    script.onload = () => {
      // Initialize Tawk_API if it doesn't exist
      if (!window.Tawk_API) {
        window.Tawk_API = {}
      }

      // Listen for auth state changes to update Tawk visitor info
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser && currentUser.email && window.Tawk_API) {
          // Set visitor information
          window.Tawk_API.visitor = {
            name: currentUser.displayName || "Spotix User",
            email: currentUser.email,
          }

          // If Tawk is already loaded, update the visitor info
          if (window.Tawk_API.setAttributes) {
            window.Tawk_API.setAttributes(
              {
                name: currentUser.displayName || "Spotix User",
                email: currentUser.email,
                userId: currentUser.uid,
              },
              (error: any) => {
                if (error) {
                  console.error("Error setting Tawk attributes:", error)
                }
              }
            )
          }
        }
      })

      // Cleanup function will be called on unmount
      return () => unsubscribe()
    }

    script.onerror = () => {
      console.error("Failed to load Tawk.to script")
    }

    document.body.appendChild(script)

    // Cleanup function
    return () => {
      const tawkScript = document.getElementById("tawk-script")
      if (tawkScript && document.body.contains(tawkScript)) {
        document.body.removeChild(tawkScript)
      }

      // Remove Tawk widget
      const tawkWidget = document.getElementById("tawk-widget")
      if (tawkWidget && document.body.contains(tawkWidget)) {
        document.body.removeChild(tawkWidget)
      }

      // Clean up global variables
      if (window.Tawk_API) {
        delete window.Tawk_API
      }
      if (window.Tawk_LoadStart) {
        delete window.Tawk_LoadStart
      }
    }
  }, [])

  return null // This component doesn't render anything
}