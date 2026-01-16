import type { Metadata } from "next"
import Signup from "./client"

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

export default function SignupPage() {
  return <Signup />
}