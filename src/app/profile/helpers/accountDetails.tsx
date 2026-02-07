"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { auth } from "@/app/lib/firebase"

interface AccountDetailsProps {
  accountName: string
  accountNumber: string
  bankName: string
  onAccountNameChange: (value: string) => void
  onAccountNumberChange: (value: string) => void
  onBankNameChange: (value: string) => void
}

const banks = [
  "Access Bank",
  "Citibank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank",
  "Globus Bank",
  "Guaranty Trust Bank",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Lotus Bank",
  "Moniepoint MFB",
  "Opay",
  "Palmpay",
  "Parallex Bank",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Taj Bank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank For Africa",
  "Unity Bank",
  "VFD Microfinance Bank",
  "Wema Bank",
  "Zenith Bank",
]

export default function AccountDetails({
  accountName,
  accountNumber,
  bankName,
  onAccountNameChange,
  onAccountNumberChange,
  onBankNameChange,
}: AccountDetailsProps) {
  const [bankInput, setBankInput] = useState(bankName)
  const [filteredBanks, setFilteredBanks] = useState<string[]>([])
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)
  const [accountVerificationLoading, setAccountVerificationLoading] = useState(false)
  const [accountVerificationError, setAccountVerificationError] = useState<string | null>(null)
  const [accountVerifiedName, setAccountVerifiedName] = useState("")
  const [accountVerificationStatus, setAccountVerificationStatus] = useState<"pending" | "verified" | "failed">("pending")

  useEffect(() => {
    setBankInput(bankName)
  }, [bankName])

  const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBankInput(value)

    if (value.trim() === "") {
      setFilteredBanks([])
      setShowBankSuggestions(false)
    } else {
      const filtered = banks.filter((bank) => bank.toLowerCase().includes(value.toLowerCase()))
      setFilteredBanks(filtered)
      setShowBankSuggestions(true)
    }
  }

  const selectBank = (bank: string) => {
    setBankInput(bank)
    onBankNameChange(bank)
    setShowBankSuggestions(false)
    setAccountVerificationStatus("pending")
    setAccountVerifiedName("")
    setAccountVerificationError(null)
  }

  const verifyAccount = async () => {
    if (!accountNumber || !bankName) {
      setAccountVerificationError("Please provide account number and bank name")
      return
    }

    if (accountNumber.length !== 10) {
      setAccountVerificationError("Account number must be 10 digits")
      return
    }

    setAccountVerificationLoading(true)
    setAccountVerificationError(null)

    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error("Authentication required")
      }

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
      const response = await fetch(`${BACKEND_URL}/verify?accountNumber=${accountNumber}&bankName=${encodeURIComponent(bankName)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.status === true) {
        setAccountVerifiedName(data.account_name)
        setAccountVerificationStatus("verified")
        onAccountNameChange(data.account_name)
        setAccountVerificationError(null)
      } else {
        setAccountVerificationError(data.message || "Failed to verify account. Please check your account details.")
        setAccountVerificationStatus("failed")
      }
    } catch (error) {
      console.error("Error verifying account:", error)
      setAccountVerificationError("An error occurred while verifying account. Please try again.")
      setAccountVerificationStatus("failed")
    } finally {
      setAccountVerificationLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Bank Account Details</h2>

      <div className="space-y-5">
        <div className="relative">
          <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 mb-2">
            Bank Name
          </label>
          <input
            type="text"
            id="bankName"
            value={bankInput}
            onChange={handleBankInputChange}
            onFocus={() => {
              if (bankInput.trim()) {
                setShowBankSuggestions(true)
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow click events
              setTimeout(() => setShowBankSuggestions(false), 200)
            }}
            placeholder="Search for your bank"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
          {showBankSuggestions && filteredBanks.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredBanks.map((bank) => (
                <button
                  key={bank}
                  type="button"
                  onClick={() => selectBank(bank)}
                  className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors text-gray-900 text-sm"
                >
                  {bank}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-2">
            Account Number
          </label>
          <input
            type="text"
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "") // Only allow digits
              if (value.length <= 10) {
                onAccountNumberChange(value)
                setAccountVerificationStatus("pending")
                setAccountVerifiedName("")
                setAccountVerificationError(null)
              }
            }}
            placeholder="Enter your 10-digit account number"
            maxLength={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
        </div>

        {accountNumber.length === 10 && bankName && accountVerificationStatus === "pending" && (
          <button
            type="button"
            onClick={verifyAccount}
            disabled={accountVerificationLoading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {accountVerificationLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Account"
            )}
          </button>
        )}

        {accountVerificationError && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700">{accountVerificationError}</p>
          </div>
        )}

        {accountVerificationStatus === "verified" && accountVerifiedName && (
          <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-700">Account Verified Successfully</p>
              <p className="text-sm text-green-600 mt-1">{accountVerifiedName}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="accountName" className="block text-sm font-semibold text-gray-700 mb-2">
            Account Name
          </label>
          <input
            type="text"
            id="accountName"
            value={accountName}
            readOnly
            placeholder="Account name will appear after verification"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed transition-all text-gray-900 placeholder-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            This field is auto-filled after successful verification
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span> This account will be used for receiving payouts from ticket sales. Please ensure the account details are correct.
          </p>
        </div>
      </div>
    </div>
  )
}