"use client"

import { useState } from "react"
import { Copy, Users, Loader2 } from "lucide-react"

interface ReferralsProps {
  referralCode: string
  referralListed: boolean
  referrerUsername: string | null
  userId: string
  onReferralCodeGenerated: (code: string) => void
}

export default function Referrals({
  referralCode,
  referralListed,
  referrerUsername,
  userId,
  onReferralCodeGenerated,
}: ReferralsProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  const generateReferralCode = async () => {
    setGeneratingCode(true)
    try {
      const response = await fetch("/api/v1/generate-referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onReferralCodeGenerated(data.referralCode)
      } else {
        alert(data.message || "Failed to generate referral code")
      }
    } catch (error) {
      console.error("Error generating referral code:", error)
      alert("An error occurred while generating referral code")
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyReferralCode = () => {
    const referralLink = `https://spotix.com.ng/auth/signup?ref=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-purple-600" size={28} />
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Referral Program</h2>
      </div>

      {referrerUsername && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Referred by:</span> @{referrerUsername}
          </p>
        </div>
      )}

      {!referralCode ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            Generate your unique referral code and earn rewards when people sign up using your link!
          </p>
          <button
            type="button"
            onClick={generateReferralCode}
            disabled={generatingCode}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            {generatingCode ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Users size={20} />
                Generate Referral Code
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Referral Code</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="flex-1 bg-white px-4 py-3 rounded-lg text-base font-mono text-gray-900 border border-purple-200 break-all">
                {referralCode}
              </code>
              <button
                type="button"
                onClick={copyReferralCode}
                className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium whitespace-nowrap ${
                  copySuccess
                    ? "bg-green-500 text-white"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                <Copy size={18} />
                {copySuccess ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              How it works
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Share your referral link with friends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>They sign up using your link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>You both earn rewards!</span>
              </li>
            </ul>
          </div>

          {!referralListed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Note:</span> Your referral code will be active once you complete your profile.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}