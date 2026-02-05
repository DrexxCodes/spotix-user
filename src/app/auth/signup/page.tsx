import type { Metadata } from "next"
import { Suspense } from "react"
import Signup from "./client"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Signup",
  description: "Create a new account on Spotix. Join Nigeria's premier event management platform.",
  keywords: [
    "Spotix signup",
    "sign in Spotix",
    "event management signup",
    "ticket booking signup Nigeria",
    "Spotix account access",
  ],
  openGraph: {
    title: "Signup",
    description: "Create a new account on Spotix. Join Nigeria's premier event management platform.",
    url: "https://spotix.com.ng/auth/signup",
    siteName: "Spotix Nigeria",
    type: "website",
    images: [
      {
        url: "https://i.postimg.cc/FR5xpcpZ/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Spotix Signup - Join Now",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Signup",
    description: "Create a new account on Spotix. Join Nigeria's premier event management platform.",
    images: ["https://i.postimg.cc/FR5xpcpZ/hero.jpg"],
  },
  alternates: {
    canonical: "https://spotix.com.ng/auth/signup",
  },
  robots: {
    index: true,
    follow: true,
  },
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-600 to-purple-500 flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-white" />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Signup />
    </Suspense>
  )
}