// app/api/v1/generate-referral/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

/**
 * Generates a random alphanumeric referral code
 * Format: 8 characters (uppercase letters and numbers)
 */
function generateRandomCode(length = 8): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * Checks if a referral code already exists in the referrals collection
 */
async function isCodeUnique(code: string): Promise<boolean> {
  try {
    const referralDocRef = doc(db, "referrals", code)
    const referralDoc = await getDoc(referralDocRef)
    return !referralDoc.exists()
  } catch (error) {
    console.error("Error checking code uniqueness:", error)
    throw error
  }
}

/**
 * Generates a unique referral code
 * Retries up to 10 times if code already exists
 */
async function generateUniqueReferralCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = generateRandomCode()
    const isUnique = await isCodeUnique(code)

    if (isUnique) {
      return code
    }

    attempts++
  }

  throw new Error("Failed to generate unique referral code after multiple attempts")
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { userId } = body

    // Validate request
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const userDocRef = doc(db, "users", userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // Check if user already has a referral code
    if (userData.referralCode) {
      // Verify that the referral code is listed in referrals collection
      const referralDocRef = doc(db, "referrals", userData.referralCode)
      const referralDoc = await getDoc(referralDocRef)

      if (referralDoc.exists()) {
        return NextResponse.json({
          success: true,
          referralCode: userData.referralCode,
          message: "User already has an active referral code",
        })
      }
    }

    // Generate a new unique referral code
    const referralCode = await generateUniqueReferralCode()

    // Create referral document in referrals collection
    const referralDocRef = doc(db, "referrals", referralCode)
    await setDoc(referralDocRef, {
      userId: userId,
      username: userData.username || "",
      fullName: userData.fullName || "",
      createdAt: new Date().toISOString(),
      referrals: [], // Array to track users who signed up with this code
      totalReferrals: 0,
      active: true,
    })

    // Update user document with the referral code
    await updateDoc(userDocRef, {
      referralCode: referralCode,
    })

    return NextResponse.json({
      success: true,
      referralCode: referralCode,
      message: "Referral code generated successfully",
    })
  } catch (error) {
    console.error("Error generating referral code:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate referral code. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}