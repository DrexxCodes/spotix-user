import type { Metadata } from "next"
import IWSSClient from "./client"

export const metadata: Metadata = {
  title: "IWSS",
  description: "View a variety of events on Nigeria's premier event management platform.",
  keywords: [
    "Spotix IWSS",
    "Spotix wallet",
    "Quick Payment Solution by Spotix",
    "Spotix ticket booking Nigeria",
    "Spotix Inter Wallet Settlement System",
  ],
  openGraph: {
    title: "IWSS",
    description: "View, manage, create and authorize trasanctions over the wallet system designed by Spotix",
    url: "https://spotix.com.ng/iwss",
    siteName: "Spotix Nigeria",
    type: "website",
    images: [
      {
        url: "https://i.postimg.cc/FR5xpcpZ/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Spotix IWSS - Inter Wallet Settlement System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IWSS",
    description: "View, manage, create and authorize trasanctions over the wallet system designed by Spotix",
    images: ["https://i.postimg.cc/FR5xpcpZ/hero.jpg"],
  },
  alternates: {
    canonical: "https://spotix.com.ng/iwss",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function IWSSPage() {
  return <IWSSClient />
}