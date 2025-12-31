// Utility functions for voting operations
import { db } from "./firebase"
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  type FieldValue,
  Timestamp,
} from "firebase/firestore"

export interface ContestantData {
  contestantId: string
  name: string
  image: string
  votes?: number // Added votes field
}

export interface VoteEntry {
  uid: string
  voteCount: number
  price: number
  contestantId: string
  contestantName: string
  date: FieldValue | string
  reference: string
  isGuest: boolean
}

export interface VoteData {
  pollName: string
  pollImage: string
  pollDescription: string
  pollStartDate: string
  pollStartTime: string
  pollEndDate: string
  pollEndTime: string
  pollAmount: number
  pollPrice: number
  pollCount: number
  pollCreation: string // Changed from FieldValue to string for client components
  pollEntries: VoteEntry[]
  contestants: ContestantData[]
  creatorId: string
}

export type PollStatus = "active" | "ended" | "notStarted"

export function getPollStatus(startDate: string, startTime: string, endDate: string, endTime: string): PollStatus {
  const now = new Date()
  const start = new Date(`${startDate}T${startTime}`)
  const end = new Date(`${endDate}T${endTime}`)

  if (now < start) return "notStarted"
  if (now > end) return "ended"
  return "active"
}

export function generateContestantId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let id = "sp-cont-"
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

export function pollNameToKey(pollName: string): string {
  return pollName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

// Helper function to convert Firestore data to plain objects
function serializePollData(data: any): VoteData {
  return {
    ...data,
    pollCreation: data.pollCreation instanceof Timestamp 
      ? data.pollCreation.toDate().toISOString() 
      : data.pollCreation || new Date().toISOString(),
    pollEntries: (data.pollEntries || []).map((entry: any) => ({
      ...entry,
      date: entry.date instanceof Timestamp 
        ? entry.date.toDate().toISOString() 
        : entry.date
    })),
    contestants: (data.contestants || []).map((contestant: any) => ({
      ...contestant,
      votes: contestant.votes || 0, // Ensure votes field exists
    }))
  }
}

export async function checkUserVotingProfile(userId: string): Promise<boolean> {
  try {
    const userVotingDoc = await getDoc(doc(db, "voting", userId))
    return userVotingDoc.exists()
  } catch (error) {
    console.error("Error checking voting profile:", error)
    return false
  }
}

export async function createUserVotingProfile(userId: string): Promise<void> {
  try {
    await setDoc(doc(db, "voting", userId), {
      createdAt: serverTimestamp(),
      totalEarnings: 0,
      totalPolls: 0,
    })
  } catch (error) {
    console.error("Error creating voting profile:", error)
    throw error
  }
}

export async function getAllUserPolls(userId: string): Promise<Array<{ id: string; data: VoteData }>> {
  try {
    const userVotesRef = collection(db, "voting", userId, "votes")
    const snapshot = await getDocs(userVotesRef)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: serializePollData(doc.data()),
    }))
  } catch (error) {
    console.error("Error fetching user polls:", error)
    return []
  }
}

export async function createVote(
  userId: string,
  voteData: Omit<VoteData, "pollCreation" | "pollCount" | "pollEntries">,
): Promise<string> {
  try {
    const userVotesRef = collection(db, "voting", userId, "votes")
    const voteRef = doc(userVotesRef)
    const voteId = voteRef.id

    // Initialize contestants with votes field
    const contestantsWithVotes = voteData.contestants.map(contestant => ({
      ...contestant,
      votes: 0
    }))

    await setDoc(voteRef, {
      ...voteData,
      contestants: contestantsWithVotes,
      pollCreation: serverTimestamp(),
      pollCount: 0,
      pollAmount: 0,
      pollEntries: [],
    })

    // Create pollKey entry
    const pollKey = pollNameToKey(voteData.pollName)
    await setDoc(doc(db, "pollKey", pollKey), {
      creatorId: userId,
      voteId: voteId,
      pollImage: voteData.pollImage,
      pollDescription: voteData.pollDescription,
      pollName: voteData.pollName,
      createdAt: serverTimestamp(),
    })

    // Update user voting profile
    await updateDoc(doc(db, "voting", userId), {
      totalPolls: increment(1),
    })

    return voteId
  } catch (error) {
    console.error("Error creating vote:", error)
    throw error
  }
}

export async function getPollDetails(userId: string, voteId: string): Promise<VoteData | null> {
  try {
    const voteDoc = await getDoc(doc(db, "voting", userId, "votes", voteId))
    return voteDoc.exists() ? serializePollData(voteDoc.data()) : null
  } catch (error) {
    console.error("Error fetching poll details:", error)
    return null
  }
}

export async function getPollByName(
  pollName: string,
): Promise<{ voteId: string; creatorId: string; pollData: VoteData } | null> {
  try {
    const pollKey = pollNameToKey(pollName)
    const pollKeyDoc = await getDoc(doc(db, "pollKey", pollKey))

    if (!pollKeyDoc.exists()) {
      return null
    }

    const { creatorId, voteId } = pollKeyDoc.data()
    const pollData = await getPollDetails(creatorId, voteId)

    if (!pollData) {
      return null
    }

    return { voteId, creatorId, pollData }
  } catch (error) {
    console.error("Error fetching poll by name:", error)
    return null
  }
}