"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Head from "next/head"
import { auth, db } from "@/app/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import Preloader from "@/components/Preloader"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import { Tooltip } from "@/components/Tooltip"

interface UserProfile {
  uid: string
  fullName: string
  username: string
  email: string
  profilePicture: string
  accountName: string
  accountNumber: string
  bankName: string
  referralCode: string
  isBooker: boolean
}

interface BookerData {
  bookerName: string
  dateOfBirth: string
  bookerPassword: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Opay",
  "Palmpay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
]

const BookerConfirm = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [bookerData, setBookerData] = useState<BookerData>({
    bookerName: "",
    dateOfBirth: "",
    bookerPassword: "",
  })
  const [consentChecked, setConsentChecked] = useState(false)
  const [profilePictureError, setProfilePictureError] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Account details states
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [accountNumber, setAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountVerificationStatus, setAccountVerificationStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle")
  const [accountVerifiedName, setAccountVerifiedName] = useState("")
  const [accountVerificationError, setAccountVerificationError] = useState("")
  
  const router = useRouter()

  // Calculate the maximum date of birth (18 years ago from today)
  const getMaxDateOfBirth = () => {
    const today = new Date()
    const eighteenYearsAgo = new Date(today)
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18)
    return eighteenYearsAgo.toISOString().split("T")[0]
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        auth.onAuthStateChanged(async (authUser) => {
          if (authUser) {
            // User is signed in
            const userDocRef = doc(db, "users", authUser.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<UserProfile, "uid">
              const userProfile = {
                uid: authUser.uid,
                ...userData,
                fullName: userData.fullName || "",
                profilePicture: userData.profilePicture || "/tempUser.svg",
                accountName: userData.accountName || "",
                accountNumber: userData.accountNumber || "",
                bankName: userData.bankName || "",
                referralCode: userData.referralCode || "",
                isBooker: userData.isBooker || false,
              }

              setUser(userProfile)
              setAccountNumber(userData.accountNumber || "")
              setBankName(userData.bankName || "")
              
              // If account details exist, set as verified
              if (userData.accountName && userData.accountNumber && userData.bankName) {
                setAccountVerifiedName(userData.accountName)
                setAccountVerificationStatus("verified")
              } else {
                // No account details, enable editing mode
                setIsEditingAccount(true)
              }

              // Check if user is already a booker
              if (userData.isBooker) {
                setLoading(false)
                return
              }

              // Pre-fill booker name with user's full name if available
              if (userData.fullName) {
                setBookerData((prev) => ({
                  ...prev,
                  bookerName: userData.fullName,
                }))
              }

              // Check if user is using default profile picture
              if (userData.profilePicture === "/tempUser.svg") {
                setProfilePictureError(true)
              }
            } else {
              // Redirect to profile if user document doesn't exist
              router.push("/profile")
            }
          } else {
            // User is signed out
            router.push("/login")
          }
          setLoading(false)
        })
      } catch (error) {
        console.error("Error checking authentication:", error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBookerData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Check age when date of birth changes
    if (name === "dateOfBirth") {
      const birthDate = new Date(value)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18) {
        setAgeError("You must be at least 18 years old to become a booker.")
      } else {
        setAgeError(null)
      }
    }
  }

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsentChecked(e.target.checked)
  }

  const handleEditAccount = () => {
    setIsEditingAccount(true)
    setAccountVerificationStatus("idle")
    setAccountVerifiedName("")
    setAccountVerificationError("")
  }

  const handleCancelEdit = () => {
    if (user) {
      setAccountNumber(user.accountNumber || "")
      setBankName(user.bankName || "")
      setIsEditingAccount(false)
      
      // Restore verified status if account details exist
      if (user.accountName && user.accountNumber && user.bankName) {
        setAccountVerifiedName(user.accountName)
        setAccountVerificationStatus("verified")
      } else {
        setAccountVerificationStatus("idle")
      }
    }
  }

  const verifyAccountDetails = async () => {
    if (!accountNumber || !bankName) {
      setAccountVerificationError("Please provide both account number and bank name")
      return
    }

    if (accountNumber.length !== 10) {
      setAccountVerificationError("Account number must be 10 digits")
      return
    }

    setAccountVerificationStatus("verifying")
    setAccountVerificationError("")
    setAccountVerifiedName("")

    try {
      const response = await fetch(
        `${BACKEND_URL}/v1/verify?accountNumber=${accountNumber}&bankName=${bankName}`,
      )
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.status === true) {
        setAccountVerifiedName(data.account_name)
        setAccountVerificationStatus("verified")
        
        // Update user state with verified name
        if (user) {
          setUser({
            ...user,
            accountName: data.account_name,
            accountNumber: accountNumber,
            bankName: bankName,
          })
        }
      } else {
        setAccountVerificationError(data.message || "Account verification failed.")
        setAccountVerificationStatus("failed")
      }
    } catch (error) {
      console.error("Error verifying account:", error)
      setAccountVerificationError("Failed to verify account. Please try again.")
      setAccountVerificationStatus("failed")
    }
  }

  const saveAccountDetails = async () => {
    if (accountVerificationStatus !== "verified" || !user) {
      setError("Please verify your account details first")
      return
    }

    try {
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        accountName: accountVerifiedName,
        accountNumber: accountNumber,
        bankName: bankName,
      })

      setIsEditingAccount(false)
      alert("Account details saved successfully!")
    } catch (error) {
      console.error("Error saving account details:", error)
      setError("Failed to save account details. Please try again.")
    }
  }

  const sendConfirmationEmail = async (name: string, email: string) => {
    setEmailSending(true)
    try {
      const response = await fetch(`${BACKEND_URL}/v1/mail/booker-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to send confirmation email:", errorText)
        throw new Error(`Failed to send confirmation email: ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Error sending confirmation email:", error)
      return false
    } finally {
      setEmailSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (profilePictureError) {
      setError("Please add a profile picture before becoming a booker.")
      return
    }

    if (ageError) {
      setError(ageError)
      return
    }

    if (accountVerificationStatus !== "verified") {
      setError("Please verify your account details before proceeding.")
      return
    }

    if (!user) return

    setLoading(true)
    try {
      // Update user profile in Firestore
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        isBooker: true,
        bookerName: bookerData.bookerName,
        dateOfBirth: bookerData.dateOfBirth,
        bookerPassword: bookerData.bookerPassword,
        accountName: accountVerifiedName,
        accountNumber: accountNumber,
        bankName: bankName,
      })

      // Send confirmation email
      const emailSuccess = await sendConfirmationEmail(bookerData.bookerName || user.fullName, user.email)

      // Show success message
      if (emailSuccess) {
        alert(
          "Congratulations! You are now a booker. We have sent a confirmation email to your registered email address.",
        )
      } else {
        alert(
          "Congratulations! You are now a booker. However, we couldn't send a confirmation email. Please check your account settings.",
        )
      }

      router.push("/profile")
    } catch (error: any) {
      console.error("Error updating booker status:", error)
      setError(`Failed to update booker status: ${error.message || "Unknown error"}`)
      setLoading(false)
    }
  }

  if (loading || !user) {
    return <Preloader />
  }

  // If user is already a booker, show dialog
  if (user.isBooker) {
    return (
      <>
        <Head>
          <title>Booker Confirm</title>
          <meta name="description" content="Find, book, and attend the best events on your campus. Discover concerts, night parties, workshops, religious events, and more on Spotix." />
          <meta property="og:title" content="Spotix | Discover and Book Campus Events" />
          <meta property="og:description" content="Explore top events in your school – concerts, workshops, parties & more. Powered by Spotix." />
          <meta property="og:image" content="/meta.png" />
          <meta property="og:url" content="https://spotix.com.ng" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Spotix | Discover and Book Campus Events" />
          <meta name="twitter:description" content="Explore top events in your school – concerts, workshops, parties & more. Powered by Spotix." />
          <meta name="twitter:image" content="/meta.png" />
        </Head>
        
        <div className="min-h-screen flex flex-col">
          <UserHeader />
          
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <img 
                src="/BookerConfirm.svg" 
                alt="Already a Booker" 
                className="w-32 h-32 mx-auto mb-6"
              />
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {user.username}, you're a booker already!
              </h2>
              
              <p className="text-gray-600 mb-8">
                No need to re-enroll. You can manage your events from your dashboard or view your profile.
              </p>
              
              <div className="space-y-3">
                <a
                  href="https://booker.spotix.com.ng"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Go to Booker Dashboard
                </a>
                
                <button
                  onClick={() => router.push("/profile")}
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Booker Confirm</title>
        <meta name="description" content="Find, book, and attend the best events on your campus. Discover concerts, night parties, workshops, religious events, and more on Spotix." />
        <meta property="og:title" content="Spotix | Discover and Book Campus Events" />
        <meta property="og:description" content="Explore top events in your school – concerts, workshops, parties & more. Powered by Spotix." />
        <meta property="og:image" content="/meta.png" />
        <meta property="og:url" content="https://spotix.com.ng" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spotix | Discover and Book Campus Events" />
        <meta name="twitter:description" content="Explore top events in your school – concerts, workshops, parties & more. Powered by Spotix." />
        <meta name="twitter:image" content="/meta.png" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <UserHeader />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <img 
                src="/BookerConfirm.svg" 
                alt="Become a Booker" 
                className="w-40 h-40 mx-auto mb-6"
              />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Become a Booker
              </h1>
              <div className="text-gray-700 leading-relaxed">
                <div className="mb-3">
                  Hello there <span className="font-semibold text-purple-600">{user.username}</span>
                </div>
                <p className="text-sm">
                  You're now taking a step to become a booker in Spotix. This will enable you to post events, verify tickets
                  and get paid. We hope you've read our terms for bookers and switching to a booker now means you've seen and
                  gone through the provisions there. It's also important that you fill the details here as we would use this
                  in creating your booker profile. A picture of you (individual booker) or your logo (Business booker) is
                  required for you to be a booker. Thank you for partnering with Spotix.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {emailSending && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-600 text-sm">Sending confirmation email...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Booker Onboarding Section */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Booker Onboarding</h2>

                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      className={`w-32 h-32 rounded-full object-cover ${
                        profilePictureError ? "ring-4 ring-red-300" : "ring-4 ring-purple-200"
                      }`}
                    />
                    {profilePictureError && (
                      <div className="mt-2 text-center text-red-600 text-sm">
                        Please add a profile picture on your profile page
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="bookerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Booker Name
                    </label>
                    <input
                      type="text"
                      id="bookerName"
                      name="bookerName"
                      value={bookerData.bookerName}
                      onChange={handleInputChange}
                      placeholder="Enter booker name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth (Must be 18 or older)
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={bookerData.dateOfBirth}
                      onChange={handleInputChange}
                      max={getMaxDateOfBirth()}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                    {ageError && (
                      <div className="mt-1 text-red-600 text-sm">{ageError}</div>
                    )}
                  </div>

                  {/* Account Details Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
                      {!isEditingAccount && accountVerificationStatus === "verified" && (
                        <button
                          type="button"
                          onClick={handleEditAccount}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>

                    {isEditingAccount ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Name
                          </label>
                          <select
                            id="bankName"
                            value={bankName}
                            onChange={(e) => {
                              setBankName(e.target.value)
                              setAccountVerificationStatus("idle")
                              setAccountVerificationError("")
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            required
                          >
                            <option value="">Select Bank</option>
                            {NIGERIAN_BANKS.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            id="accountNumber"
                            value={accountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              if (value.length <= 10) {
                                setAccountNumber(value)
                                setAccountVerificationStatus("idle")
                                setAccountVerificationError("")
                              }
                            }}
                            placeholder="Enter 10-digit account number"
                            maxLength={10}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            required
                          />
                        </div>

                        {accountVerificationStatus === "verified" && accountVerifiedName && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-800">
                              ✓ Account Name: {accountVerifiedName}
                            </p>
                          </div>
                        )}

                        {accountVerificationError && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{accountVerificationError}</p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={verifyAccountDetails}
                            disabled={accountVerificationStatus === "verifying" || !accountNumber || !bankName}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                          >
                            {accountVerificationStatus === "verifying" ? "Verifying..." : "Verify Account"}
                          </button>
                          
                          {accountVerificationStatus === "verified" && (
                            <button
                              type="button"
                              onClick={saveAccountDetails}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                              Save Details
                            </button>
                          )}
                          
                          {user.accountNumber && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Account Name</p>
                          <p className="font-medium text-gray-900">{accountVerifiedName || "Not set"}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Account Number</p>
                          <p className="font-medium text-gray-900">{accountNumber || "Not set"}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                          <p className="font-medium text-gray-900">{bankName || "Not set"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booker Authentication Section */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Booker Authentication</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user.email}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="bookerPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Booker Password
                      <Tooltip message="This password may not necessarily be the same as your regular password" />
                    </label>
                    <input
                      type="password"
                      id="bookerPassword"
                      name="bookerPassword"
                      value={bookerData.bookerPassword}
                      onChange={handleInputChange}
                      placeholder="Enter booker password"
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={handleConsentChange}
                        required
                        className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        By switching to a booker and supplying these details you agree that we should process your information
                        accordingly
                      </span>
                    </label>
                  </div>

                  {consentChecked && !ageError && accountVerificationStatus === "verified" && (
                    <button
                      type="submit"
                      disabled={emailSending}
                      className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                    >
                      {emailSending ? "Processing..." : "Activate Booker"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  )
}

export default BookerConfirm