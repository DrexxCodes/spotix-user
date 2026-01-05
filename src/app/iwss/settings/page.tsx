import type { Metadata } from "next"
import IWSSSettings from "./client"

export const metadata: Metadata = {
  title: "IWSS Settings | Spotix",
  description: "Sign back into your Spotix Account. Access your events, tickets, and bookings on Nigeria's premier event management platform.",
  keywords: [
    "Spotix login",
    "sign in Spotix",
    "event management login",
    "ticket booking login Nigeria",
    "Spotix account access",
  ],
  openGraph: {
    title: "IWSS Settings | Spotix",
    description: "Manage your IWSS account.",
    url: "https://spotix.com.ng/iwss/settings",
    siteName: "Spotix Nigeria",
    type: "website",
    images: [
      {
        url: "https://i.postimg.cc/FR5xpcpZ/hero.jpg",
        width: 1200,
        height: 630,
        alt: "IWSS Settings - Manage Your IWSS Account",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IWSS Settings | Spotix",
    description: "Manage your IWSS account.",
    images: ["https://i.postimg.cc/FR5xpcpZ/hero.jpg"],
  },
  alternates: {
    canonical: "https://spotix.com.ng/iwss/settings",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function IWSSSettingsPage() {
  return <IWSSSettings />
}