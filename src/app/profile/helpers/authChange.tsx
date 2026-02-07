"use client"

import { useState } from "react"
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { auth } from "@/app/lib/firebase"

export default function AuthChange() {
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authChangeLoading, setAuthChangeLoading] = useState(false)
  const [authChangeError, setAuthChangeError] = useState<string | null>(null)
  const [authChangeSuccess, setAuthChangeSuccess] = useState<string | null>(null)

  const handleEmailChange = async () => {
    if (!newEmail || !password) {
      setAuthChangeError("Please provide both email and password")
      return
    }

    setAuthChangeLoading(true)
    setAuthChangeError(null)
    setAuthChangeSuccess(null)

    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        throw new Error("No authenticated user found")
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)

      // Update email
      await updateEmail(user, newEmail)

      setAuthChangeSuccess("Email updated successfully!")
      setPassword("")
    } catch (error: any) {
      console.error("Error changing email:", error)
      if (error.code === "auth/wrong-password") {
        setAuthChangeError("Incorrect password")
      } else if (error.code === "auth/email-already-in-use") {
        setAuthChangeError("This email is already in use")
      } else if (error.code === "auth/invalid-email") {
        setAuthChangeError("Invalid email format")
      } else {
        setAuthChangeError("Failed to update email. Please try again.")
      }
    } finally {
      setAuthChangeLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Change Email</h2>

      <div className="space-y-5">
        <div>
          <label htmlFor="newEmail" className="block text-sm font-semibold text-gray-700 mb-2">
            New Email Address
          </label>
          <input
            type="email"
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {authChangeError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-sm text-red-700">{authChangeError}</p>
          </div>
        )}

        {authChangeSuccess && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-sm text-green-700">{authChangeSuccess}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleEmailChange}
          disabled={authChangeLoading || !newEmail || !password}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
        >
          {authChangeLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Email"
          )}
        </button>
      </div>
    </div>
  )
}