import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signup API Route for User Portal
 * 
 * POST /api/signup - Handle user signup (no email verification)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, username, referralCode } = body;
    const warnings: string[] = [];

    // Validate required fields
    if (!email || !password || !fullName || !username) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields: email, password, fullName, username",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLower = email.toLowerCase();
    if (!emailRegex.test(email) || (!emailLower.endsWith(".com") && !emailLower.endsWith(".com.ng"))) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Please enter a valid email address ending with .com or .com.ng",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Username must be at least 3 characters long",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Password must be at least 6 characters long",
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }

    let userId: string;
    let referrerUsername = "";
    let referralProcessed = false;

    try {
      // Step 1: Create Firebase Auth user (no email verification required)
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: username,
        emailVerified: true, // Set to true to skip verification
      });

      userId = userRecord.uid;
      console.log("Firebase Auth user created:", userId);

      // Step 2: Update signup analytics (daily, monthly, yearly) - Nigerian timezone
      try {
        const now = new Date();
        const nigerianTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour for WAT

        const year = nigerianTime.getUTCFullYear().toString();
        const month = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, "0")}`;
        const day = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, "0")}-${String(nigerianTime.getUTCDate()).padStart(2, "0")}`;

        console.log("Updating signup analytics:", { year, month, day });

        const analyticsUpdateData = {
          usersSignedUp: FieldValue.increment(1),
          lastUpdated: FieldValue.serverTimestamp(),
        };

        // Create batch for atomic analytics updates
        const analyticsBatch = adminDb.batch();

        const dailyRef = adminDb.collection("admin").doc("analytics").collection("daily").doc(day);
        analyticsBatch.set(dailyRef, analyticsUpdateData, { merge: true });

        const monthlyRef = adminDb.collection("admin").doc("analytics").collection("monthly").doc(month);
        analyticsBatch.set(monthlyRef, analyticsUpdateData, { merge: true });

        const yearlyRef = adminDb.collection("admin").doc("analytics").collection("yearly").doc(year);
        analyticsBatch.set(yearlyRef, analyticsUpdateData, { merge: true });

        await analyticsBatch.commit();
        console.log("Signup analytics updated successfully");
      } catch (analyticsError) {
        console.error("Error updating signup analytics:", analyticsError);
        warnings.push("Analytics update encountered an issue");
      }

      // Step 3: Verify referral code if provided
      if (referralCode && referralCode.trim()) {
        try {
          const referralDocRef = adminDb.collection("referrals").doc(referralCode.trim());
          const referralDoc = await referralDocRef.get();

          if (!referralDoc.exists) {
            warnings.push("Referral code does not exist, continuing without referral benefits");
          } else {
            const referralData = referralDoc.data();
            referrerUsername = referralData?.username || "";
          }
        } catch (referralError) {
          console.error("Error verifying referral:", referralError);
          warnings.push("Unable to verify referral code, continuing without referral benefits");
        }
      }

      // Step 4: Create Firestore user document (no emailVerified field)
      try {
        await adminDb.collection("users").doc(userId).set({
          fullName,
          username,
          email,
          referralCodeUsed: referralCode?.trim() || null,
          referredBy: referrerUsername || null,
          isBooker: false,
          wallet: 0.0,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log("Firestore user document created");
      } catch (firestoreError) {
        console.error("Error creating Firestore user document:", firestoreError);
        warnings.push("User profile creation encountered an issue");
      }

      // Step 5: Create IWSS balance document
      let iwssCreated = false;
      try {
        await adminDb.collection("IWSS").doc(userId).set({
          balance: 0,
          active: true,
          createdAt: FieldValue.serverTimestamp(),
        });
        iwssCreated = true;
        console.log("IWSS balance document created");
      } catch (iwssError) {
        console.error("Error creating IWSS document:", iwssError);
        warnings.push("Wallet initialization encountered an issue");
      }

      // Step 6: Process referral if valid
      if (referralCode && referralCode.trim() && referrerUsername) {
        try {
          const referralDocRef = adminDb.collection("referrals").doc(referralCode.trim());
          const referralDoc = await referralDocRef.get();

          if (referralDoc.exists) {
            const newReferredUser = {
              username: username,
              email: email,
              fullName: fullName,
              joinedAt: new Date().toISOString(),
              userId: userId,
            };

            await referralDocRef.update({
              referredUsers: FieldValue.arrayUnion(newReferredUser),
              refGain: FieldValue.increment(200),
              totalReferrals: FieldValue.increment(1),
              lastReferralAt: FieldValue.serverTimestamp(),
            });

            referralProcessed = true;
            console.log("Referral processed successfully");
          }
        } catch (referralError) {
          console.error("Error processing referral:", referralError);
          warnings.push("Referral benefits could not be applied");
        }
      }

      // Step 7: Send welcome email via external backend
      let welcomeEmailSent = false;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (backendUrl) {
          const response = await fetch(`${backendUrl}/v1/mail/welcome-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              name: fullName || username,
            }),
          });

          if (response.ok) {
            welcomeEmailSent = true;
            console.log("Welcome email sent successfully");
          } else {
            console.error("Failed to send welcome email:", await response.text());
            warnings.push("Welcome email could not be sent");
          }
        } else {
          warnings.push("Backend URL not configured for welcome email");
        }
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        warnings.push("Welcome email could not be sent");
      }

      // Return success response
      return NextResponse.json(
        {
          success: true,
          message: "Account created successfully!",
          userId: userId,
          data: {
            email,
            username,
            referralProcessed,
            iwssCreated,
            welcomeEmailSent,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Signup error:", error);

      // Handle Firebase Auth errors
      let errorMessage = "Unable to create your account. Please try again";
      if (error.code === "auth/email-already-exists") {
        errorMessage = "An account with this email already exists. Please try logging in instead";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Please choose a stronger password";
      }

      return NextResponse.json(
        {
          error: "Signup Failed",
          message: errorMessage,
          details: error.message,
          developer: "API developed and maintained by Spotix Technologies",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in signup API:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
        developer: "API developed and maintained by Spotix Technologies",
      },
      { status: 500 }
    );
  }
}