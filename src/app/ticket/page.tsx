import type { Metadata } from "next"
import TicketClient from "./TicketClient"

export const metadata: Metadata = {
  title: "Your Ticket - Spotix",
  description: "Your event ticket details and confirmation",
}

export default function TicketPage() {
  return <TicketClient />
}
