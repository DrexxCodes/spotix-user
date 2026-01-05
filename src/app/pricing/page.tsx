import type { Metadata } from "next"
import PricingClient from "./client"

export const metadata: Metadata = {
  title: "Pricing - Transparent Event Ticketing Rates | Spotix Nigeria",
  description: "Discover Spotix's transparent pricing for event ticketing, voting, and merchandise sales. Only 5% + ₦100 per ticket sold. No hidden fees. Graphics design, custom event pages, branded emails, and smart cards available.",
  keywords: [
    "Spotix pricing",
    "event ticketing rates Nigeria",
    "ticket booking fees",
    "event management pricing",
    "voting rates Nigeria",
    "merchandise sales fees",
    "event ticketing cost",
    "Spotix fees",
    "event platform pricing Nigeria",
    "transparent ticketing fees",
    "custom event pages",
    "branded event emails",
    "Spotix smart card",
  ],
  openGraph: {
    title: "Pricing - Transparent Event Ticketing Rates | Spotix Nigeria",
    description: "Transparent pricing for event ticketing (5% + ₦100 per ticket), voting (10%), and merchandise sales (10%). Graphics design, custom event pages, and more.",
    url: "https://spotix.com.ng/pricing",
    siteName: "Spotix Nigeria",
    type: "website",
    images: [
      {
        url: "https://i.postimg.cc/FR5xpcpZ/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Spotix Pricing - Transparent Event Ticketing Rates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - Transparent Event Ticketing Rates | Spotix Nigeria",
    description: "Transparent pricing for event ticketing (5% + ₦100 per ticket), voting (10%), and merchandise sales (10%). No hidden fees.",
    images: ["https://i.postimg.cc/FR5xpcpZ/hero.jpg"],
  },
  alternates: {
    canonical: "https://spotix.com.ng/pricing",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PricingPage() {
  return <PricingClient />
}