// Firebase Admin SDK configuration for server-side operations
import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"
import { getAuth, type Auth } from "firebase-admin/auth"

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
}

// Initialize Firebase Admin app if not already initialized
const adminApp: App = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]

// Initialize Admin Firestore and Auth
export const adminDb: Firestore = getFirestore(adminApp)
export const adminAuth: Auth = getAuth(adminApp)

// Also export the auth function for backwards compatibility if needed
export const auth = () => adminAuth

export default adminApp