import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";

/**
 * Server-side utility to get current authenticated user from session cookie
 * Use this in Server Components and API routes
 * Dev by Drexx @2025
 */

export interface CurrentUser {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  emailVerified: boolean;
  isBooker: boolean;
  balance: number;
  createdAt: string;
}

/**
 * Get current user from session cookie
 * Returns null if not authenticated or session is invalid
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    // Fetch user data from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.error("User document not found for:", userId);
      return null;
    }

    const userData = userDoc.data();

    // Fetch balance from IWSS
    let balance = 0;
    try {
      const iwssDoc = await adminDb.collection("IWSS").doc(userId).get();
      if (iwssDoc.exists) {
        const iwssData = iwssDoc.data();
        balance = iwssData?.balance || 0;
      }
    } catch (error) {
      console.error("Error fetching IWSS balance:", error);
    }

    // Get email verification status from Auth
    const userRecord = await adminAuth.getUser(userId);

    return {
      uid: userId,
      email: userRecord.email || userData?.email || "",
      username: userData?.username || "",
      fullName: userData?.fullName || "",
      emailVerified: userRecord.emailVerified,
      isBooker: userData?.isBooker || false,
      balance: balance,
      createdAt: userData?.createdAt?.toDate?.()?.toISOString() || "",
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get user ID from session cookie
 * Lighter weight version that only returns the user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

/**
 * Verify if user is authenticated
 * Returns boolean indicating authentication status
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error("Authentication required");
  }
  
  return userId;
}