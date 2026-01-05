"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Preloader from "@/components/Preloader"

export default function IWSSPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/iwss/settings")
  }, [router])

  return <Preloader />
}