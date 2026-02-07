import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/app/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }   // ← Promise here
) {
  try {
    const resolvedParams = await params;             // ← await it
    const { uid } = resolvedParams;

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // Check if referral code is listed
    let referralListed = false;
    if (userData?.referralCode) {
      const referralDoc = await adminDb.collection("referrals").doc(userData.referralCode).get();
      referralListed = referralDoc.exists;
    }

    // Get Firebase Auth user data
    const authUser = await adminAuth.getUser(uid);

    return NextResponse.json({
      success: true,
      user: {
        uid,
        fullName: userData?.fullName || "",
        username: userData?.username || "",
        email: authUser.email || userData?.email || "",
        profilePicture: userData?.profilePicture || "/tempUser.svg",
        accountName: userData?.accountName || "",
        accountNumber: userData?.accountNumber || "",
        bankName: userData?.bankName || "",
        referralCode: userData?.referralCode || "",
        isBooker: userData?.isBooker || false,
        referredBy: userData?.referredBy || "",
        telegramConnected: userData?.telegramConnected || false,
        telegramUsername: userData?.telegramUsername || "",
        telegramChatId: userData?.telegramChatId || "",
      },
      referralListed,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }   // ← same fix here
) {
  try {
    const resolvedParams = await params;             // ← await it
    const { uid } = resolvedParams;

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, username, accountName, accountNumber, bankName, profilePicture } = body;

    // Update user data in Firestore
    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (username !== undefined) updateData.username = username;
    if (accountName !== undefined) updateData.accountName = accountName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    await adminDb.collection("users").doc(uid).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}