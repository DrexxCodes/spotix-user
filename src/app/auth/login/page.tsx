"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Mail, Loader2, CheckCircle, Shield, User, X } from "lucide-react"
import { auth } from "../../lib/firebase"
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth"

type LoginProps = {}

const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [showVerificationOption, setShowVerificationOption] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null)
  const [verificationMessage, setVerificationMessage] = useState("")
  const [formTouched, setFormTouched] = useState(false)

  const router = useRouter()

  const words = ["Event", "Party", "Meeting", "Conference", "Gathering", "Workshop"]

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
    let index = 0
    const interval = setInterval(() => {
      const animatedText = document.getElementById("animated-text")
      if (animatedText) {
        animatedText.style.opacity = "0"
        setTimeout(() => {
          animatedText.textContent = words[index]
          animatedText.style.opacity = "1"
          index = (index + 1) % words.length
        }, 300)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Check for verification message from signup
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("verified") === "true") {
      setVerificationMessage("Your account has been created successfully! Please check your email to verify your account before logging in.")

      const timer = setTimeout(() => {
        setVerificationMessage("")
      }, 12000)

      return () => clearTimeout(timer)
    }
  }, [])

  // Clear error when user starts typing
  useEffect(() => {
    if (formTouched && (email || password)) {
      setError("")
    }
  }, [email, password, formTouched])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setShowVerificationOption(false)
    setLoggingIn(true)
    setFormTouched(true)

    // Client-side validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      setLoggingIn(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoggingIn(false)
      return
    }

    try {
      // Step 1: Sign in with Firebase Auth to check email verification
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if email is verified
      if (!user.emailVerified) {
        setUnverifiedUser(user)
        setShowVerificationOption(true)
        setError("Please verify your email address before signing in.")
        setLoggingIn(false)
        return
      }

      // Step 2: Get ID token from Firebase
      const idToken = await user.getIdToken()

      // Step 3: Call API route to create session cookie
      const response = await fetch("/api/v1/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          idToken: idToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Unable to sign in. Please try again")
        setLoggingIn(false)
        return
      }

      console.log("Login successful:", data)

      // Store user data in localStorage (optional, for quick access)
      if (typeof window !== "undefined") {
        localStorage.setItem("spotix_user", JSON.stringify(data.user))
      }

      // Clear form
      setEmail("")
      setPassword("")
      
      // Redirect to home
      router.push("/home")
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Handle Firebase Auth errors
      let errorMessage = "Unable to sign in. Please try again"
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Incorrect email or password"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please wait and try again"
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Please check your internet connection and try again"
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled"
      } else if (error.message) {
        // Use the error message from the API if available
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setLoggingIn(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedUser) return

    setSendingVerification(true)
    setVerificationSent(false)

    try {
      await sendEmailVerification(unverifiedUser)
      setVerificationSent(true)
      setTimeout(() => {
        setVerificationSent(false)
      }, 8000)
    } catch (error: any) {
      console.error("Error resending verification:", error)
      setError("Unable to send verification email. Please try again")
    } finally {
      setSendingVerification(false)
    }
  }

  const dismissError = () => {
    setError("")
    setShowVerificationOption(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-600 to-purple-500 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-white" />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Sign In | Spotix</title>
        <meta name="description" content="Sign in to your Spotix account to manage events and bookings" />
        <link rel="canonical" href="/login" />
        <meta property="og:title" content="Sign In | Spotix" />
        <meta property="og:description" content="Sign in to your Spotix account to manage events and bookings" />
        <meta property="og:url" content="/login" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#6b2fa5] via-purple-600 to-purple-500 flex items-center justify-center p-4 md:p-8">
        <div className="flex items-center justify-center gap-8 lg:gap-16 w-full max-w-7xl">
          {/* Login Form */}
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 backdrop-blur-lg p-8 md:p-12 w-full max-w-md">
            <div className="text-center mb-10">
              <img 
                src="/logo.svg" 
                alt="Spotix Logo" 
                className="w-20 h-20 mx-auto mb-4 rounded-full object-cover shadow-lg shadow-[#6b2fa5]/20"
              />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-base">Sign in to your account to continue</p>
            </div>

            {/* Verification Success Message */}
            {verificationMessage && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-400 rounded-xl animate-in slide-in-from-top duration-300">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-800 text-sm font-medium leading-relaxed">{verificationMessage}</p>
                </div>
                <button
                  onClick={() => setVerificationMessage("")}
                  className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors"
                  aria-label="Dismiss message"
                >
                  <X size={18} className="text-green-600" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-400 rounded-xl animate-in slide-in-from-top duration-300">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={dismissError}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                  aria-label="Dismiss error"
                >
                  <X size={18} className="text-red-600" />
                </button>
              </div>
            )}

            {/* Verification Option */}
            {showVerificationOption && (
              <div className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-[#6b2fa5] rounded-xl animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={20} className="text-[#6b2fa5]" />
                  <h3 className="text-lg font-semibold text-[#6b2fa5]">Email Verification Required</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">
                  We've sent a verification link to your email address. Please check your inbox and click the link to
                  verify your account.
                </p>

                <button
                  onClick={handleResendVerification}
                  disabled={sendingVerification || verificationSent}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white font-semibold py-3.5 px-5 rounded-xl shadow-lg shadow-[#6b2fa5]/30 hover:shadow-xl hover:shadow-[#6b2fa5]/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {sendingVerification ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sending verification email...</span>
                    </>
                  ) : verificationSent ? (
                    <>
                      <CheckCircle size={18} />
                      <span>Verification email sent!</span>
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>

                {verificationSent && (
                  <div className="mt-4 p-3 bg-green-100/50 border border-green-300 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ Verification email sent successfully! Please check your inbox and spam folder.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6 mb-8">
              {/* Email Input */}
              <div className="group">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <User size={16} className="text-gray-500" />
                  <span>Email Address</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#6b2fa5] focus:bg-white focus:shadow-lg focus:shadow-[#6b2fa5]/10 focus:-translate-y-0.5 transition-all duration-200"
                />
              </div>

              {/* Password Input */}
              <div className="group">
                <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Shield size={16} className="text-gray-500" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    minLength={6}
                    className="w-full px-4 py-3.5 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#6b2fa5] focus:bg-white focus:shadow-lg focus:shadow-[#6b2fa5]/10 focus:-translate-y-0.5 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#6b2fa5] hover:bg-[#6b2fa5]/10 rounded-lg transition-all duration-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loggingIn || !email || !password}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-[#6b2fa5]/30 hover:shadow-2xl hover:shadow-[#6b2fa5]/40 hover:-translate-y-1 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-lg"
              >
                {loggingIn ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Auth Links */}
            <div className="text-center space-y-3 mb-8">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link 
                  href="/auth/signup" 
                  className="text-[#6b2fa5] font-semibold hover:text-purple-700 hover:underline transition-colors"
                >
                  Create account
                </Link>
              </p>
              <p className="text-gray-600 text-sm">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-gray-600 font-medium hover:text-[#6b2fa5] hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </p>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
              <Shield size={16} className="text-gray-500" />
              <span className="text-gray-600 text-xs font-medium">
                Your information is protected with enterprise-grade security
              </span>
            </div>
          </div>

          {/* Right Side Text - Hidden on Mobile */}
          <div className="hidden lg:block bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-12 max-w-md text-center">
            <img 
              src="/logo.svg" 
              alt="Spotix Logo" 
              className="w-24 h-24 mx-auto mb-6 rounded-full object-cover drop-shadow-lg"
            />
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Use Spotix to Book That{" "}
              <span 
                id="animated-text" 
                className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100 bg-clip-text text-transparent transition-opacity duration-300"
              >
                Event
              </span>
            </h2>
            <p className="text-white/90 text-base leading-relaxed">
              Join thousands of event organizers who trust Spotix for seamless event management and booking experiences.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login