"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Head from "next/head"
import { auth } from "@/app/lib/firebase"
import Preloader from "@/components/Preloader"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import Keypad from "../helper/keypad"

interface IWSSStatus {
  hasPinSet: boolean
  active: boolean
  reason: string | null
  balance: number
}

const IWSSSettings = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [iwssStatus, setIwssStatus] = useState<IWSSStatus | null>(null)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)
  const [showSetPinDialog, setShowSetPinDialog] = useState(false)
  const [showChangePinDialog, setShowChangePinDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState(false)
  const [resetKeypadTrigger, setResetKeypadTrigger] = useState(0)
  
  // PIN states
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter")
  const [firstPin, setFirstPin] = useState("")
  const [processingPin, setProcessingPin] = useState(false)
  const [pinError, setPinError] = useState("")
  
  // Change PIN states
  const [changePinStep, setChangePinStep] = useState<"current" | "new" | "confirm">("current")
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        auth.onAuthStateChanged(async (authUser) => {
          if (authUser) {
            setUser(authUser)
            await fetchIWSSStatus(authUser)
          } else {
            router.push("/login")
          }
        })
      } catch (error) {
        console.error("Error checking authentication:", error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchIWSSStatus = async (authUser: any) => {
    try {
      const token = await authUser.getIdToken()
      const response = await fetch("/api/v1/v1/iwss/pin", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch IWSS status")
      }

      const data = await response.json()
      setIwssStatus(data.data)
      
      // Show welcome dialog if PIN not set
      if (!data.data.hasPinSet) {
        setShowWelcomeDialog(true)
      }
      
      setLoading(false)
    } catch (error) {
      console.error("Error fetching IWSS status:", error)
      setError("Failed to load IWSS settings")
      setLoading(false)
    }
  }

  const handleSetPin = async (pin: string) => {
    if (pinStep === "enter") {
      setFirstPin(pin)
      setPinStep("confirm")
      setPinError("")
      // Clear the keypad for confirmation entry
      setResetKeypadTrigger(prev => prev + 1)
    } else if (pinStep === "confirm") {
      if (pin !== firstPin) {
        setPinError("PINs do not match. Please try again")
        setPinStep("enter")
        setFirstPin("")
        setResetKeypadTrigger(prev => prev + 1)
        return
      }

      // Submit PIN
      setProcessingPin(true)
      setPinError("")

      try {
        const token = await user.getIdToken()
        const response = await fetch("/api/v1/iwss/pin", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin: pin,
            confirmPin: pin,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to set PIN")
        }

        setSuccess("PIN set successfully!")
        setShowSetPinDialog(false)
        setPinStep("enter")
        setFirstPin("")
        setResetKeypadTrigger(prev => prev + 1)
        
        // Refresh IWSS status
        await fetchIWSSStatus(user)
        
        setTimeout(() => setSuccess(null), 5000)
      } catch (error: any) {
        setPinError(error.message || "Failed to set PIN. Please try again")
      } finally {
        setProcessingPin(false)
      }
    }
  }

  const handleChangePin = async (pin: string) => {
    if (changePinStep === "current") {
      // Verify current PIN against database immediately
      setProcessingPin(true)
      setPinError("")

      try {
        const token = await user.getIdToken()
        
        // Fetch IWSS document and verify PIN
        const response = await fetch("/api/v1/iwss/pin", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to verify PIN")
        }

        // We need to verify the PIN on the backend
        // Let's create a temporary verification by attempting the change with same PIN
        const verifyResponse = await fetch("/api/v1/iwss/pin/verify", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pin }),
        })

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json()
          throw new Error(errorData.message || "Current PIN is incorrect")
        }

        // PIN is correct, proceed to next step
        setCurrentPin(pin)
        setChangePinStep("new")
        setResetKeypadTrigger(prev => prev + 1)
      } catch (error: any) {
        setPinError(error.message || "Current PIN is incorrect")
        setResetKeypadTrigger(prev => prev + 1)
      } finally {
        setProcessingPin(false)
      }
    } else if (changePinStep === "new") {
      if (pin === currentPin) {
        setPinError("New PIN must be different from current PIN")
        setResetKeypadTrigger(prev => prev + 1)
        return
      }
      setNewPin(pin)
      setChangePinStep("confirm")
      setPinError("")
      setResetKeypadTrigger(prev => prev + 1)
    } else if (changePinStep === "confirm") {
      if (pin !== newPin) {
        setPinError("PINs do not match. Please try again")
        setChangePinStep("new")
        setNewPin("")
        setResetKeypadTrigger(prev => prev + 1)
        return
      }

      // Submit PIN change
      setProcessingPin(true)
      setPinError("")

      try {
        const token = await user.getIdToken()
        const response = await fetch("/api/v1/iwss/pin", {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPin: currentPin,
            newPin: pin,
            confirmNewPin: pin,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to change PIN")
        }

        setSuccess("PIN changed successfully!")
        setShowChangePinDialog(false)
        setChangePinStep("current")
        setCurrentPin("")
        setNewPin("")
        setResetKeypadTrigger(prev => prev + 1)
        
        setTimeout(() => setSuccess(null), 5000)
      } catch (error: any) {
        setPinError(error.message || "Failed to change PIN. Please try again")
      } finally {
        setProcessingPin(false)
      }
    }
  }

  const handleStatusToggle = async (newStatus: boolean) => {
    if (!newStatus) {
      setShowDeactivateDialog(true)
      return
    }

    // Reactivating account
    await updateAccountStatus(true, "")
  }

  const handleDeactivateConfirm = async () => {
    if (!deactivateReason.trim()) {
      setError("Please provide a reason for deactivating your account")
      return
    }

    await updateAccountStatus(false, deactivateReason)
    setShowDeactivateDialog(false)
    setDeactivateReason("")
  }

  const updateAccountStatus = async (active: boolean, reason: string) => {
    setProcessingStatus(true)
    setError(null)

    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/v1/iwss/status", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active,
          reason: reason || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status")
      }

      setSuccess(`Account ${active ? "activated" : "deactivated"} successfully!`)
      
      // Refresh IWSS status
      await fetchIWSSStatus(user)
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      setError(error.message || "Failed to update account status")
      setTimeout(() => setError(null), 5000)
    } finally {
      setProcessingStatus(false)
    }
  }

  const closeSetPinDialog = () => {
    setShowSetPinDialog(false)
    setPinStep("enter")
    setFirstPin("")
    setPinError("")
    setResetKeypadTrigger(prev => prev + 1)
  }

  const closeChangePinDialog = () => {
    setShowChangePinDialog(false)
    setChangePinStep("current")
    setCurrentPin("")
    setNewPin("")
    setPinError("")
    setResetKeypadTrigger(prev => prev + 1)
  }

  if (loading || !user || !iwssStatus) {
    return <Preloader />
  }

  return (
    <>
      <Head>
        <title>IWSS Settings - Spotix</title>
        <meta name="description" content="Manage your Inter Wallet Settlement System settings on Spotix" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50">
        <UserHeader />

        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {/* Header with Fintech Design */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6b2fa5] to-purple-600 rounded-3xl blur-2xl opacity-10"></div>
            <div className="relative bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6b2fa5] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent">
                    IWSS Settings
                  </h1>
                  <p className="text-gray-600 text-sm">Secure wallet management system</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700">256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                  <svg className="w-3 h-3 text-[#6b2fa5]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Bank-Grade Security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 font-medium text-sm">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Account Status Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Account Status</h2>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-6 mb-4 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                      iwssStatus.active 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                        : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        iwssStatus.active ? "bg-white" : "bg-white"
                      } animate-pulse`}></span>
                      {iwssStatus.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {!iwssStatus.active && iwssStatus.reason && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      Reason: {iwssStatus.reason}
                    </p>
                  )}
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={iwssStatus.active}
                    onChange={(e) => handleStatusToggle(e.target.checked)}
                    disabled={processingStatus}
                    className="sr-only peer"
                  />
                  <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#6b2fa5] peer-checked:to-purple-600 shadow-inner"></div>
                </label>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Wallet Balance</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent">
                      ₦{iwssStatus.balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#6b2fa5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PIN Management Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6b2fa5] to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">PIN Management</h2>
            </div>

            {!iwssStatus.hasPinSet ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="h-10 w-10 text-[#6b2fa5]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Your Wallet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Set up a 4-digit PIN to protect your IWSS wallet and enable secure transactions.
                </p>
                <button
                  onClick={() => setShowSetPinDialog(true)}
                  className="bg-gradient-to-r from-[#6b2fa5] to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Set PIN Now
                  </span>
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg
                      className="h-9 w-9 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">PIN Configured</h3>
                    <p className="text-sm text-gray-600">Your wallet is secured with a 4-digit PIN</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-medium text-gray-600">Encryption</p>
                    </div>
                    <p className="text-xs text-gray-500">Bcrypt Hashed</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-medium text-gray-600">Protected</p>
                    </div>
                    <p className="text-xs text-gray-500">Rate Limited</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs font-medium text-gray-600">Secure</p>
                    </div>
                    <p className="text-xs text-gray-500">Bank-Grade</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowChangePinDialog(true)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-[#6b2fa5] shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-[#6b2fa5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Change PIN
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <Footer />

        {/* Welcome Dialog */}
        {showWelcomeDialog && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl w-full max-w-lg p-8 animate-slide-up shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#6b2fa5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome to IWSS Settings
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm">
                  <strong>IWSS</strong> stands for <strong>Inter Wallet Settlement System</strong> and it is a mini wallet system designed by Spotix Technologies to facilitate lightning-fast transactions on the web across Spotix infrastructure. 
                  IWSS will soon be exposing SDKs that developers can use on their websites. 
                  <br /><br />
                  Enough intro, you're probably here to set your account PIN. You'll only do this once and then can use it in Spotix.
                </p>
              </div>
              <button
                onClick={() => setShowWelcomeDialog(false)}
                className="w-full bg-[#6b2fa5] hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Okay
              </button>
            </div>
          </div>
        )}

        {/* Set PIN Dialog */}
        {showSetPinDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-purple-100">
              <button
                onClick={closeSetPinDialog}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6b2fa5] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent mb-2">
                  {pinStep === "enter" ? "Set Your PIN" : "Confirm Your PIN"}
                </h2>
                <p className="text-sm text-gray-600">
                  {pinStep === "enter" 
                    ? "Create a secure 4-digit PIN for your wallet" 
                    : "Enter your PIN again to confirm"}
                </p>
              </div>

              <Keypad
                onComplete={handleSetPin}
                label={pinStep === "enter" ? "Enter 4-digit PIN" : "Re-enter PIN to confirm"}
                error={pinError}
                loading={processingPin}
                resetTrigger={resetKeypadTrigger}
              />
            </div>
          </div>
        )}

        {/* Change PIN Dialog */}
        {showChangePinDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl border border-purple-100">
              <button
                onClick={closeChangePinDialog}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6b2fa5] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent mb-2">
                  Change Your PIN
                </h2>
                <p className="text-sm text-gray-600">Update your wallet security PIN</p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-6 px-4">
                <div className="flex items-center justify-between relative">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                      changePinStep === "current" 
                        ? "bg-gradient-to-br from-[#6b2fa5] to-purple-600 text-white ring-4 ring-purple-200" 
                        : changePinStep === "new" || changePinStep === "confirm"
                        ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {changePinStep === "new" || changePinStep === "confirm" ? "✓" : "1"}
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-600">Current</span>
                  </div>

                  {/* Progress Line 1 */}
                  <div className="absolute top-5 left-[20%] right-[60%] h-1 -translate-y-1/2">
                    <div className={`h-full rounded transition-all ${
                      changePinStep === "new" || changePinStep === "confirm"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gray-200"
                    }`} />
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                      changePinStep === "new"
                        ? "bg-gradient-to-br from-[#6b2fa5] to-purple-600 text-white ring-4 ring-purple-200"
                        : changePinStep === "confirm"
                        ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {changePinStep === "confirm" ? "✓" : "2"}
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-600">New</span>
                  </div>

                  {/* Progress Line 2 */}
                  <div className="absolute top-5 left-[60%] right-[20%] h-1 -translate-y-1/2">
                    <div className={`h-full rounded transition-all ${
                      changePinStep === "confirm"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gray-200"
                    }`} />
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                      changePinStep === "confirm"
                        ? "bg-gradient-to-br from-[#6b2fa5] to-purple-600 text-white ring-4 ring-purple-200"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      3
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-600">Confirm</span>
                  </div>
                </div>
              </div>

              <Keypad
                onComplete={handleChangePin}
                label={
                  changePinStep === "current" ? "Enter current PIN" :
                  changePinStep === "new" ? "Enter new PIN" :
                  "Confirm new PIN"
                }
                error={pinError}
                loading={processingPin}
                resetTrigger={resetKeypadTrigger}
              />
            </div>
          </div>
        )}

        {/* Deactivate Dialog */}
        {showDeactivateDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-red-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Deactivate Account
                </h2>
                <p className="text-gray-600 text-sm">
                  Your wallet will be temporarily disabled until you reactivate it.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    Please provide a reason for deactivating your IWSS account.
                  </p>
                </div>
              </div>

              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Enter reason for deactivation..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none mb-2 transition-all"
              />
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-500">
                  {deactivateReason.length}/500 characters
                </p>
                {deactivateReason.length > 0 && (
                  <button
                    onClick={() => setDeactivateReason("")}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeactivateDialog(false)
                    setDeactivateReason("")
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-all duration-200 border-2 border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateConfirm}
                  disabled={!deactivateReason.trim() || processingStatus}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-red-300 disabled:to-rose-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                >
                  {processingStatus ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing
                    </span>
                  ) : (
                    "Deactivate"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default IWSSSettings