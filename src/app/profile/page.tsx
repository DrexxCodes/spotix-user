"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/lib/firebase"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { signOut, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import { uploadImage } from "@/utils/imageUploader"
import { Eye, EyeOff, AlertCircle, CheckCircle, Users, Copy, Loader2 } from "lucide-react"
import Image from "next/image"

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
  referredBy?: string
  telegramConnected?: boolean
  telegramUsername?: string
  telegramChatId?: string
}

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }: ConfirmDialogProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirmation Required</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-[#6b2fa5] hover:bg-[#5a2789] rounded-lg transition-colors"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  )
}

const Profile = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [bankInput, setBankInput] = useState("")
  const [filteredBanks, setFilteredBanks] = useState<string[]>([])
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [uploadProvider, setUploadProvider] = useState<string | null>(null)
  const [referralListed, setReferralListed] = useState(false)
  const [referrerUsername, setReferrerUsername] = useState<string | null>(null)
  const router = useRouter()

  // Telegram connection states
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null)
  const [telegramConnecting, setTelegramConnecting] = useState(false)
  const [telegramConnectionToken, setTelegramConnectionToken] = useState<string | null>(null)
  const [tokenCopySuccess, setTokenCopySuccess] = useState(false)

  // Auth change states
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authChangeLoading, setAuthChangeLoading] = useState(false)
  const [authChangeError, setAuthChangeError] = useState<string | null>(null)
  const [authChangeSuccess, setAuthChangeSuccess] = useState<string | null>(null)

  const [accountVerificationLoading, setAccountVerificationLoading] = useState(false)
  const [accountVerificationError, setAccountVerificationError] = useState<string | null>(null)
  const [accountVerifiedName, setAccountVerifiedName] = useState("")
  const [accountVerificationStatus, setAccountVerificationStatus] = useState<"pending" | "verified" | "failed">(
    "pending",
  )

  const banks = [
    "Opay",
    "Palmpay",
    "Moniepoint",
    "Kuda",
    "First Bank",
    "Access Bank",
    "GT Bank",
    "UBA",
    "Zenith Bank",
    "Wema Bank",
    "Sterling Bank",
    "Fidelity Bank",
    "Union Bank",
    "Stanbic IBTC",
    "Ecobank",
  ]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        auth.onAuthStateChanged(async (authUser) => {
          if (authUser) {
            const userDocRef = doc(db, "users", authUser.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<UserProfile, "uid">
              setUser({
                uid: authUser.uid,
                ...userData,
                fullName: userData.fullName || "",
                profilePicture: userData.profilePicture || "/tempUser.svg",
                accountName: userData.accountName || "",
                accountNumber: userData.accountNumber || "",
                bankName: userData.bankName || "",
                referralCode: userData.referralCode || "",
                isBooker: userData.isBooker || false,
                referredBy: userData.referredBy || "",
                telegramConnected: userData.telegramConnected || false,
                telegramUsername: userData.telegramUsername || "",
                telegramChatId: userData.telegramChatId || "",
              })

              setTelegramConnected(userData.telegramConnected || false)
              setTelegramUsername(userData.telegramUsername || null)

              if (userData.bankName) {
                setBankInput(userData.bankName)
              }

              if (authUser.email) {
                setNewEmail(authUser.email)
              }

              if (userData.referralCode) {
                const referralDocRef = doc(db, "referrals", userData.referralCode)
                const referralDoc = await getDoc(referralDocRef)
                setReferralListed(referralDoc.exists())
              }

              if (userData.referredBy) {
                setReferrerUsername(userData.referredBy)
              }
            } else {
              const newUser = {
                fullName: "",
                username: "",
                email: authUser.email || "",
                profilePicture: "/tempUser.svg",
                accountName: "",
                accountNumber: "",
                bankName: "",
                referralCode: "",
                isBooker: false,
              }
              await setDoc(userDocRef, newUser)
              setUser({ uid: authUser.uid, ...newUser })

              if (authUser.email) {
                setNewEmail(authUser.email)
              }
            }
          } else {
            router.push("/auth/login")
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

  useEffect(() => {
    if (user && user.accountName && user.accountNumber && user.bankName) {
      setAccountVerifiedName(user.accountName)
      setAccountVerificationStatus("verified")
    }
  }, [user])

  useEffect(() => {
    if (copySuccess || tokenCopySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false)
        setTokenCopySuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [copySuccess, tokenCopySuccess])

  useEffect(() => {
    if (authChangeSuccess || authChangeError) {
      const timer = setTimeout(() => {
        setAuthChangeSuccess(null)
        setAuthChangeError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [authChangeSuccess, authChangeError])

  useEffect(() => {
    if (telegramConnectionToken && !telegramConnected) {
      const pollInterval = setInterval(async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user!.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            if (userData.telegramConnected) {
              setTelegramConnected(true)
              setTelegramUsername(userData.telegramUsername)
              setTelegramConnecting(false)
              setTelegramConnectionToken(null)

              setUser({
                ...user!,
                telegramConnected: true,
                telegramUsername: userData.telegramUsername,
                telegramChatId: userData.telegramChatId,
              })

              clearInterval(pollInterval)
            }
          }
        } catch (error) {
          console.error("Error polling connection status:", error)
        }
      }, 3000)

      const timeout = setTimeout(() => {
        clearInterval(pollInterval)
        setTelegramConnecting(false)
        setTelegramConnectionToken(null)
      }, 10 * 60 * 1000)

      return () => {
        clearInterval(pollInterval)
        clearTimeout(timeout)
      }
    }
  }, [telegramConnectionToken, telegramConnected, user])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      let profilePictureUrl = user.profilePicture

      if (imageFile) {
        setUploadingImage(true)

        const { uploadPromise } = uploadImage(imageFile, {
          cloudinaryFolder: "ProfilePictures",
          showAlert: true,
        })
        const { url, provider } = await uploadPromise

        if (url) {
          profilePictureUrl = url
          setUploadProvider(provider)
        } else {
          throw new Error("Failed to upload profile picture")
        }

        setUploadingImage(false)
      }

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        fullName: user.fullName,
        username: user.username,
        profilePicture: profilePictureUrl,
        accountName: user.accountName,
        accountNumber: user.accountNumber,
        bankName: user.bankName,
        imageProvider: uploadProvider,
      })

      setUser({
        ...user,
        profilePicture: profilePictureUrl,
      })

      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = async () => {
    if (!user || !auth.currentUser) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setAuthChangeError("Please enter a valid email address")
      return
    }

    if (newEmail === user.email) {
      setAuthChangeError("New email is the same as current email")
      return
    }

    setAuthChangeLoading(true)
    setAuthChangeError(null)
    setAuthChangeSuccess(null)

    try {
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(auth.currentUser, credential)

      await updateEmail(auth.currentUser, newEmail)

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        email: newEmail,
      })

      setUser({
        ...user,
        email: newEmail,
      })

      setAuthChangeSuccess("Email updated successfully!")
      setPassword("")
    } catch (error: any) {
      console.error("Error updating email:", error)
      if (error.code === "auth/requires-recent-login") {
        setAuthChangeError("For security reasons, please log out and log back in before changing your email")
      } else if (error.code === "auth/wrong-password") {
        setAuthChangeError("Incorrect password. Please try again")
      } else if (error.code === "auth/email-already-in-use") {
        setAuthChangeError("This email is already in use by another account")
      } else {
        setAuthChangeError("Failed to update email. Please try again")
      }
    } finally {
      setAuthChangeLoading(false)
    }
  }

  const generateReferralCode = async () => {
    if (!user) return

    setGeneratingCode(true)
    try {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let randomCode = ""
      for (let i = 0; i < 6; i++) {
        randomCode += characters.charAt(Math.floor(Math.random() * characters.length))
      }

      const referralCode = `${user.username.substring(0, 4).toUpperCase()}-${randomCode}`

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        referralCode,
      })

      setUser({
        ...user,
        referralCode,
      })

      const isListed = await checkReferralListed(referralCode)
      if (isListed) {
        alert("Referral code generated successfully and is already listed in our system!")
      } else {
        alert("Referral code generated successfully! Visit the Referrals page to list it and start earning.")
      }
    } catch (error) {
      console.error("Error generating referral code:", error)
      alert("Failed to generate referral code. Please try again.")
    } finally {
      setGeneratingCode(false)
    }
  }

  const checkReferralListed = async (referralCode: string) => {
    try {
      const referralDocRef = doc(db, "referrals", referralCode)
      const referralDoc = await getDoc(referralDocRef)
      return referralDoc.exists()
    } catch (error) {
      console.error("Error checking referral status:", error)
      return false
    }
  }

  const copyReferralCode = async () => {
    if (!user?.referralCode) return

    try {
      await navigator.clipboard.writeText(user.referralCode)
      setCopySuccess(true)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      alert("Failed to copy referral code. Please try again.")
    }
  }

  const handleBookerStatusClick = () => {
    if (!user?.isBooker) {
      router.push("/booker-confirm")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleBankInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBankInput(value)

    if (user) {
      setUser({
        ...user,
        bankName: value,
      })
    }

    if (value.trim() !== "") {
      const filtered = banks.filter((bank) => bank.toLowerCase().includes(value.toLowerCase()))
      setFilteredBanks(filtered)
      setShowBankSuggestions(true)
    } else {
      setFilteredBanks([])
      setShowBankSuggestions(false)
    }
  }

  const selectBank = (bank: string) => {
    setBankInput(bank)
    if (user) {
      setUser({
        ...user,
        bankName: bank,
      })
    }
    setShowBankSuggestions(false)
  }

  const handleAccountNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10)
    if (user) {
      setUser({
        ...user,
        accountNumber: value,
      })
    }
  }

  const verifyAccount = async () => {
    if (!user?.accountNumber || !user.bankName) {
      setAccountVerificationError("Please enter both account number and bank name.")
      return
    }

    setAccountVerificationLoading(true)
    setAccountVerificationError(null)
    setAccountVerifiedName("")
    setAccountVerificationStatus("pending")

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/verify?accountNumber=${user.accountNumber}&bankName=${user.bankName}`,
      )
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()

      if (data.status === true) {
        setAccountVerifiedName(data.account_name)
        setAccountVerificationStatus("verified")
        setUser({
          ...user,
          accountName: data.account_name,
        })
      } else {
        setAccountVerificationError(data.message || "Account verification failed.")
        setAccountVerificationStatus("failed")
      }
    } catch (error) {
      console.error("Error verifying account:", error)
      setAccountVerificationError("Failed to verify account. Please try again.")
      setAccountVerificationStatus("failed")
    } finally {
      setAccountVerificationLoading(false)
    }
  }

  const canSubmitForm = () => {
    return accountVerificationStatus === "verified" && user?.accountNumber && user?.bankName && user?.accountName
  }

  const goToReferrals = () => {
    router.push("/referrals")
  }

  const generateConnectionToken = async () => {
    if (!user) return null

    const token = `${user.uid}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    try {
      await setDoc(doc(db, "telegramTokens", token), {
        uid: user.uid,
        userEmail: user.email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
      })

      return token
    } catch (error) {
      console.error("Error generating connection token:", error)
      return null
    }
  }

  const handleTelegramConnect = async () => {
    if (!user) return

    setTelegramConnecting(true)

    try {
      const token = await generateConnectionToken()
      if (!token) {
        alert("Failed to generate connection token. Please try again.")
        setTelegramConnecting(false)
        return
      }

      setTelegramConnectionToken(token)
    } catch (error) {
      console.error("Error connecting to Telegram:", error)
      alert("Failed to generate connection token. Please try again.")
      setTelegramConnecting(false)
    }
  }

  const copyConnectionToken = async () => {
    if (!telegramConnectionToken) return

    try {
      await navigator.clipboard.writeText(telegramConnectionToken)
      setTokenCopySuccess(true)
    } catch (err) {
      console.error("Failed to copy token: ", err)
      alert("Failed to copy connection token. Please try again.")
    }
  }

  const handleProceedToBot = () => {
    window.open("https://t.me/TristarAI_bot", "_blank")
  }

  const handleTelegramDisconnect = async () => {
    if (!user) return

    try {
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        telegramConnected: false,
        telegramUsername: "",
        telegramChatId: "",
        telegramFirstName: "",
        telegramLastName: "",
      })

      setTelegramConnected(false)
      setTelegramUsername(null)
      setUser({
        ...user,
        telegramConnected: false,
        telegramUsername: "",
        telegramChatId: "",
      })

      alert("Telegram account disconnected successfully!")
    } catch (error) {
      console.error("Error disconnecting Telegram:", error)
      alert("Failed to disconnect Telegram. Please try again.")
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#6b2fa5] mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#6b2fa5] shadow-lg">
                  <Image
                    src={imagePreview || user.profilePicture}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#6b2fa5] text-white text-sm font-medium rounded-full">
                  {user.isBooker ? "Booker" : "User"}
                </div>
              </div>
              <label
                htmlFor="profile-image"
                className="mt-6 px-6 py-2 bg-[#6b2fa5] text-white rounded-lg hover:bg-[#5a2789] transition-colors cursor-pointer"
              >
                Change Picture
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* User Details Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={user.fullName}
                  onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b2fa5] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={user.username}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b2fa5] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* User ID Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User ID</h2>
            <div>
              <label htmlFor="uid" className="block text-sm font-medium text-gray-700 mb-2">
                Your User ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="uid"
                  value={user.uid}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 font-mono text-sm"
                />
                <button
                  type="button"
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    copySuccess
                      ? "bg-green-500 text-white"
                      : "bg-[#6b2fa5] text-white hover:bg-[#5a2789]"
                  }`}
                  onClick={() => {
                    navigator.clipboard.writeText(user.uid)
                    setCopySuccess(true)
                    setTimeout(() => setCopySuccess(false), 3000)
                  }}
                >
                  {copySuccess ? "Copied!" : "Copy UID"}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your user identification code is used to perform personalized and specialized actions on your account.
              </p>
            </div>
          </div>

          {/* Auth Change Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Auth Change</h2>

            {authChangeError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{authChangeError}</p>
              </div>
            )}

            {authChangeSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm">{authChangeSuccess}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b2fa5] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b2fa5] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEmailChange}
                disabled={authChangeLoading || newEmail === user.email || !password}
                className="w-full px-6 py-3 bg-[#6b2fa5] text-white rounded-lg hover:bg-[#5a2789] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {authChangeLoading ? "Updating..." : "Update Email"}
              </button>
            </div>
          </div>

          {/* Account Details Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="bankName"
                    value={bankInput}
                    onChange={handleBankInputChange}
                    placeholder="Enter bank name"
                    autoComplete="off"
                    disabled={accountVerificationStatus === "verified"}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b2fa5] focus:border-transparent ${
                      accountVerificationStatus === "verified" ? "bg-gray-50 text-gray-600" : ""
                    }`}
                  />
                  {showBankSuggestions && filteredBanks.length > 0 && accountVerificationStatus !== "verified" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredBanks.map((bank, index) => (
                        <div
                          key={index}
                          onClick={() => selectBank(bank)}
                          className="px-4 py-3 hover:bg-[#6b2fa5] hover:text-white cursor-pointer transition-colors"
                        >
                          {bank}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={user.accountNumber}
                  onChange={handleAccountNumberChange}
                  placeholder="Enter account number"
                  maxLength={10}
                  disabled={accountVerificationStatus === "verified"}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b2fa5] focus:border-transparent ${
                    accountVerificationStatus === "verified" ? "bg-gray-50 text-gray-600" : ""
                  }`}
                />
                {user.accountNumber && user.accountNumber.length < 10 && accountVerificationStatus !== "verified" && (
                  <p className="mt-2 text-sm text-orange-600">
                    Account number must be exactly 10 digits
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="accountName"
                    value={accountVerifiedName || user.accountName}
                    readOnly
                    placeholder="Verify account to populate name"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                  />
                  {accountVerificationStatus !== "verified" && (
                    <button
                      type="button"
                      onClick={verifyAccount}
                      disabled={
                        !user.accountNumber ||
                        !user.bankName ||
                        accountVerificationLoading ||
                        user.accountNumber.length !== 10
                      }
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {accountVerificationLoading ? "Verifying..." : "Verify"}
                    </button>
                  )}
                </div>
                {accountVerificationError && (
                  <p className="mt-2 text-sm text-red-600">{accountVerificationError}</p>
                )}
                {accountVerificationStatus === "verified" && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Account verified
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Referral Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Referrals</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={user.referralCode}
                  readOnly
                  placeholder="No referral code generated"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 font-mono"
                />
                {user.referralCode && (
                  <button
                    type="button"
                    onClick={copyReferralCode}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      copySuccess
                        ? "bg-green-500 text-white"
                        : "bg-[#6b2fa5] text-white hover:bg-[#5a2789]"
                    }`}
                  >
                    {copySuccess ? "Copied!" : "Copy Code"}
                  </button>
                )}
              </div>
              {!user.referralCode ? (
                <button
                  type="button"
                  onClick={generateReferralCode}
                  disabled={generatingCode}
                  className="w-full px-6 py-3 bg-[#6b2fa5] text-white rounded-lg hover:bg-[#5a2789] disabled:opacity-50 transition-colors font-medium"
                >
                  {generatingCode ? "Generating..." : "Generate Referral Code"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToReferrals}
                  className="w-full px-6 py-3 bg-[#6b2fa5] text-white rounded-lg hover:bg-[#5a2789] transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Users size={20} />
                  Manage Referrals
                </button>
              )}

              <div className="pt-4 border-t border-gray-200">
                {referrerUsername ? (
                  <p className="text-sm text-gray-600">
                    You were referred by <span className="font-semibold text-[#6b2fa5]">{referrerUsername}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">You weren't referred by a user on Spotix</p>
                )}
              </div>
            </div>
          </div>

          {/* Telegram Bot Connection Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/telegram-logo.png" alt="Telegram" width={32} height={32} />
              <h2 className="text-2xl font-bold text-gray-900">Telegram Bot</h2>
              <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide animate-pulse">
                New
              </span>
            </div>

            <div className="bg-gradient-to-br from-[#0088cc] to-[#229ed9] rounded-lg p-6 text-white">
              {!telegramConnected ? (
                <div>
                  <p className="mb-6 text-white/90 leading-relaxed">
                    Connect your Telegram account to receive event notifications, ticket updates, and manage your Spotix
                    account through our bot.
                  </p>

                  {!telegramConnectionToken ? (
                    <button
                      type="button"
                      onClick={handleTelegramConnect}
                      disabled={telegramConnecting}
                      className="w-full sm:w-auto px-6 py-3 bg-white/20 border-2 border-white/30 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all font-semibold flex items-center justify-center gap-3"
                    >
                      <Image src="/telegram-logo.png" alt="Telegram" width={24} height={24} />
                      {telegramConnecting ? "Generating Token..." : "Generate Connection Token"}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          🔑 Connection Token Generated
                        </h4>
                        <p className="text-white/90 text-sm mb-4">
                          Copy the token below and use the <code className="bg-white/20 px-2 py-1 rounded">
                            /connect
                          </code> command in our Telegram bot:
                        </p>
                      </div>

                      <div className="bg-black/20 rounded-lg p-4">
                        <div className="flex gap-3">
                          <code className="flex-1 bg-white/10 px-4 py-3 rounded-lg text-sm font-mono break-all border border-white/20">
                            {telegramConnectionToken}
                          </code>
                          <button
                            type="button"
                            onClick={copyConnectionToken}
                            className={`px-4 py-3 rounded-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap ${
                              tokenCopySuccess
                                ? "bg-green-500/30 border-green-500/50"
                                : "bg-white/20 border-white/30 hover:bg-white/30"
                            } border`}
                          >
                            <Copy size={18} />
                            {tokenCopySuccess ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleProceedToBot}
                          className="flex-1 px-6 py-3 bg-white/20 border-2 border-white/30 text-white rounded-lg hover:bg-white/30 transition-all font-semibold flex items-center justify-center gap-3"
                        >
                          <Image src="/telegram-logo.png" alt="Telegram" width={20} height={20} />
                          Proceed to Bot
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTelegramConnectionToken(null)
                            setTelegramConnecting(false)
                          }}
                          className="px-6 py-3 bg-transparent border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all font-medium"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="font-semibold mb-3 text-sm">Instructions:</p>
                        <ol className="space-y-2 text-sm text-white/90 list-decimal list-inside">
                          <li>Copy the token above</li>
                          <li>Click "Proceed to Bot" to open Telegram</li>
                          <li>
                            Type <code className="bg-white/20 px-2 py-1 rounded">/connect</code> and paste your token
                          </li>
                          <li>Your account will be connected automatically</li>
                        </ol>
                      </div>

                      {telegramConnecting && (
                        <div className="text-center py-4">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-white/90 text-sm">Waiting for connection...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle size={24} className="text-green-400" />
                    <p className="font-semibold text-lg">Connection Successful!</p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center p-2">
                          <Image src="/telegram-logo.png" alt="Telegram" width={32} height={32} />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">@{telegramUsername}</p>
                          <p className="text-white/80 text-sm">Connected to Spotix Bot</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTelegramDisconnect}
                        className="px-4 py-2 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 transition-all text-sm font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booker Status Section */}
          {!user.isBooker && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <button
                type="button"
                onClick={handleBookerStatusClick}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#6b2fa5] to-[#8b4fc5] text-white rounded-lg hover:from-[#5a2789] hover:to-[#7a3fb5] transition-all font-bold text-lg shadow-lg"
              >
                Become a Booker
              </button>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={uploadingImage || !canSubmitForm()}
            className="w-full px-6 py-4 bg-[#6b2fa5] text-white rounded-lg hover:bg-[#5a2789] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg shadow-lg"
          >
            {uploadingImage ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg shadow-lg"
          >
            Logout
          </button>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default Profile