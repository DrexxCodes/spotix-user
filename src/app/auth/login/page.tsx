import type { Metadata } from "next"
import LoginClient from "./client"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign back into your Spotix Account. Access your events, tickets, and bookings on Nigeria's premier event management platform.",
  keywords: [
    "Spotix login",
    "sign in Spotix",
    "event management login",
    "ticket booking login Nigeria",
    "Spotix account access",
  ],
  openGraph: {
    title: "Login",
    description: "Sign back into your Spotix Account. Access your events, tickets, and bookings.",
    url: "https://spotix.com.ng/auth/login",
    siteName: "Spotix Nigeria",
    type: "website",
    images: [
      {
        url: "https://i.postimg.cc/FR5xpcpZ/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Spotix Nigeria Login",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login",
    description: "Sign back into your Spotix Account. Access your events, tickets, and bookings.",
    images: ["https://i.postimg.cc/FR5xpcpZ/hero.jpg"],
  },
  alternates: {
    canonical: "https://spotix.com.ng/auth/login",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginPage() {
  return <LoginClient />
}