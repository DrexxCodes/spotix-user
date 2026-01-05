import type { Metadata } from "next"
import VotingClient from "./client"

export const metadata: Metadata = {
  title: "Voting | Spotix",
  description: "Create and participate in polls. Vote on your favorite options and see real-time results.",
  keywords: [
    "Spotix referrals",
    "earn money referring friends",
    "referral program Nigeria",
    "event platform rewards",
    "invite friends earn money",
    "Spotix referral code",
    "referral earnings",
  ],
  openGraph: {
    title: "Voting | Spotix",
    description: "Create and participate in polls. Vote on your favorite options and see real-time results.",
    url: "https://spotix.com.ng/vote",
    siteName: "Spotix Nigeria",
    type: "website",
    images: [
      {
        url: "https://i.postimg.cc/FR5xpcpZ/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Spotix Voting - Create and Vote",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voting | Spotix",
    description: "Create and participate in polls. Vote on your favorite options and see real-time results.",
    images: ["https://i.postimg.cc/FR5xpcpZ/hero.jpg"],
  },
  alternates: {
    canonical: "https://spotix.com.ng/vote",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function VotingPage() {
  return <VotingClient />
}