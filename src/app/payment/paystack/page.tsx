import type { Metadata } from "next"
import PaystackClient from "./PaystackClient"

export const metadata: Metadata = {
  title: "Paystack Payment - Spotix",
  description: "Complete your payment securely with Paystack",
}

export default function PaystackPage() {
  return <PaystackClient />
}
    