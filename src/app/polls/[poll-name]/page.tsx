import type { Metadata } from "next"
import { getPollByName } from "@/app/lib/voting-utils"
import { adminAuth } from "@/app/lib/firebase-admin"
import { cookies } from "next/headers"
import PollClient from "./pollClient"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"

interface Props {
  params: Promise<{ "poll-name": string }>
}

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")
    
    if (!sessionCookie) {
      return null
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true)
    return decodedClaims.uid
  } catch (error) {
    console.log("No valid session found")
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "poll-name": pollName } = await params
  const decodedName = decodeURIComponent(pollName)
  const pollData = await getPollByName(decodedName)

  if (!pollData) {
    return {
      title: "Poll Not Found",
      description: "This poll does not exist",
    }
  }

  return {
    title: pollData.pollData.pollName,
    description: pollData.pollData.pollDescription,
    openGraph: {
      title: pollData.pollData.pollName,
      description: pollData.pollData.pollDescription,
      images: [
        {
          url: pollData.pollData.pollImage,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}

export default async function PollPage({ params }: Props) {
  const { "poll-name": pollName } = await params
  const decodedName = decodeURIComponent(pollName)
  const pollData = await getPollByName(decodedName)
  const userId = await getUserIdFromSession()

  if (!pollData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <UserHeader />
        <main className="flex-1 flex items-center justify-center max-w-6xl mx-auto w-full px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Poll Not Found</h1>
            <p className="text-slate-600 mb-6">The poll you're looking for doesn't exist or has been removed.</p>
            <a
              href="/vote"
              className="inline-block px-6 py-2 bg-[#6b2fa5] text-white rounded-lg font-semibold hover:bg-[#5a1f8a] transition-colors"
            >
              Back to Polls
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <UserHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <PollClient pollData={pollData.pollData} voteId={pollData.voteId} userId={userId} />
      </main>
      <Footer />
    </div>
  )
}