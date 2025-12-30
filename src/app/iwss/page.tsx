"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Preloader from "@/components/Preloader"

export default function IWSSPage() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to settings page
    router.replace("/iwss/settings")
  }, [router])

  return <Preloader />
}