// app/api/v1/generate-referral/route.ts
import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/app/lib/firebase-admin"

/**
 * Generates a referral code based on username
 * Format: username with random 4-digit number suffix
 * Example: johndoe1234
 */
function generateReferralCodeFromUsername(username: string): string {
  // Clean username: remove special characters, convert to lowercase
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "")
  
  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  
  // Combine username with random number
  return `${cleanUsername}${randomNum}`
}

/**
 * Checks if a referral code already exists in the referrals collection
 */
async function isCodeUnique(code: string): Promise<boolean> {
  try {
    const referralDoc = await adminDb.collection("referrals").doc(code).get()
    return !referralDoc.exists
  } catch (error) {
    console.error("Error checking code uniqueness:", error)
    throw error
  }
}

/**
 * Generates a unique referral code based on username
 * Retries up to 10 times if code already exists
 */
async function generateUniqueReferralCode(username: string): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = generateReferralCodeFromUsername(username)
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
    const userDoc = await adminDb.collection("users").doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // Check if user has a username
    if (!userData?.username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username is required to generate a referral code. Please set your username first.",
        },
        { status: 400 }
      )
    }

    // Check if user already has a referral code
    if (userData.referralCode) {
      // Verify that the referral code is listed in referrals collection
      const referralDoc = await adminDb.collection("referrals").doc(userData.referralCode).get()

      if (referralDoc.exists) {
        return NextResponse.json({
          success: true,
          referralCode: userData.referralCode,
          message: "User already has an active referral code",
        })
      }
    }

    // Generate a new unique referral code based on username
    const referralCode = await generateUniqueReferralCode(userData.username)

    // Create referral document in referrals collection
    await adminDb.collection("referrals").doc(referralCode).set({
      userId: userId,
      username: userData.username,
      fullName: userData.fullName || "",
      createdAt: new Date().toISOString(),
      referrals: [], // Array to track users who signed up with this code
      totalReferrals: 0,
      active: true,
    })

    // Update user document with the referral code
    await adminDb.collection("users").doc(userId).update({
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