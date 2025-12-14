import type { Metadata } from "next"
import PaymentClient from "./PaymentClient"

export const metadata: Metadata = {
  title: "Payment - Spotix",
  description: "Choose your payment method for event tickets on Spotix",
  openGraph: {
    title: "Payment - Spotix",
    description: "Choose your payment method for event tickets on Spotix",
    type: "website",
  },
}

export default function PaymentPage() {
  return <PaymentClient />
}
