// app/page.tsx (SERVER COMPONENT ✅)

import LandingClient from "@/components/landing/client";

export const metadata = {
  title: "Spotix – Event Ticketing & Booking Platform",
  description: "Spotix helps users discover events, book tickets, and helps creators manage ticket sales easily.",
};

export default function Page() {
  return <LandingClient />;
}
