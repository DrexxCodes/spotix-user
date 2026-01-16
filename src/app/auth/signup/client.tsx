"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Shield, User, Mail, Lock, Users, X } from "lucide-react"

const Signup: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [referral, setReferral] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signingUp, setSigningUp] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [formTouched, setFormTouched] = useState(false)

  // Focus states for better UX
  const [fullNameFocused, setFullNameFocused] = useState(false)
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [referralFocused, setReferralFocused] = useState(false)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [emailExtension, setEmailExtension] = useState("")

  const router = useRouter()

  // Words for animation
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

  // Real-time password matching validation
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword)
    } else {
      setPasswordMatch(true)
    }
  }, [password, confirmPassword])

  // Clear errors when user starts typing
  useEffect(() => {
    if (formTouched && (email || password || fullName || username)) {
      setError("")
    }
  }, [email, password, fullName, username, formTouched])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailLower = email.toLowerCase()
    return emailRegex.test(email) && (emailLower.endsWith(".com") || emailLower.endsWith(".com.ng"))
  }

  // Get email extension
  const getEmailExtension = (email: string): string => {
    const parts = email.toLowerCase().split("@")
    if (parts.length === 2) {
      const domainParts = parts[1].split(".")
      if (domainParts.length >= 2) {
        // Check for .com.ng
        if (domainParts.length >= 3 && domainParts[domainParts.length - 2] === "com" && domainParts[domainParts.length - 1] === "ng") {
          return ".com.ng"
        }
        // Otherwise return the last part
        return "." + domainParts[domainParts.length - 1]
      }
    }
    return ""
  }

  // Handle email blur - validate immediately
  const handleEmailBlur = () => {
    setEmailFocused(false)
    if (email.trim()) {
      const isValid = validateEmail(email)
      setEmailValid(isValid)
      if (!isValid) {
        setEmailExtension(getEmailExtension(email))
      }
    } else {
      setEmailValid(null)
      setEmailExtension("")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setFormTouched(true)

    // Client-side validation
    if (!fullName.trim()) {
      setError("Please enter your full name")
      return
    }

    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address ending with .com or .com.ng")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setSigningUp(true)

    try {
      // Call the API route for signup
      const response = await fetch("/api/v1/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "signup",
          email,
          password,
          fullName,
          username,
          referralCode: referral.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Unable to create your account. Please try again")
        setSigningUp(false)
        return
      }

      // Show success message with warnings if any
      let successMsg = "Account created successfully!"
      if (data.warnings && data.warnings.length > 0) {
        successMsg += " Note: " + data.warnings.join(", ")
      }
      setSuccess(successMsg)

      // Clear form
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setFullName("")
      setUsername("")
      setReferral("")

      // Redirect to login with verification message
      setTimeout(() => {
        router.push("/auth/login?verified=true")
      }, 2000)
    } catch (err: any) {
      console.error("Signup error:", err)
      setError("Unable to create your account. Please try again")
      setSigningUp(false)
    }
  }

  const dismissError = () => {
    setError("")
  }

  const dismissSuccess = () => {
    setSuccess("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-500 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-white" />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Create Account</title>
        <meta name="description" content="Join Spotix and start your event management journey today" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-500 flex items-center justify-center p-4 md:p-8">
        <div className="flex items-center justify-center gap-8 lg:gap-12 w-full max-w-7xl">
          {/* Signup Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#6b2fa5] scrollbar-track-gray-200">
            <div className="text-center mb-8">
              <img src="/logo.svg" alt="Spotix Logo" className="w-16 h-16 mx-auto mb-3 rounded-full object-cover" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent mb-2">Create Your Account</h1>
              <p className="text-gray-600 text-sm">Join thousands of event organizers on Spotix</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-400 rounded-xl animate-in slide-in-from-top duration-300">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
                <button onClick={dismissError} className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors" aria-label="Dismiss error">
                  <X size={16} className="text-red-600" />
                </button>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-400 rounded-xl animate-in slide-in-from-top duration-300">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-800 text-sm font-medium">{success}</p>
                </div>
                <button onClick={dismissSuccess} className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors" aria-label="Dismiss message">
                  <X size={16} className="text-green-600" />
                </button>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              {/* Full Name */}
              <div className={`transition-all duration-200 ${fullNameFocused || fullName ? "-translate-y-0.5" : ""}`}>
                <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:shadow-lg focus:shadow-purple-600/10 transition-all duration-200"
                />
              </div>

              {/* Username */}
              <div className={`transition-all duration-200 ${usernameFocused || username ? "-translate-y-0.5" : ""}`}>
                <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User size={16} />
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:shadow-lg focus:shadow-purple-600/10 transition-all duration-200"
                  minLength={3}
                />
              </div>

              {/* Email */}
              <div className={`transition-all duration-200 ${emailFocused || email ? "-translate-y-0.5" : ""}`}>
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailValid(null)
                      setEmailExtension("")
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={handleEmailBlur}
                    required
                    autoComplete="email"
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-200 ${
                      emailValid === false && !emailFocused
                        ? "border-red-400 focus:border-red-500 focus:shadow-red-500/10"
                        : emailValid === true && !emailFocused
                        ? "border-green-400 focus:border-green-500 focus:shadow-green-500/10"
                        : "border-gray-200 focus:border-purple-600 focus:shadow-purple-600/10"
                    }`}
                  />
                  {!emailFocused && email && emailValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailValid ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <X size={20} className="text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {!emailFocused && emailValid === false && emailExtension && (
                  <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                    <X size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Emails must end with .com or .com.ng. The extension <strong>{emailExtension}</strong> is not supported.</span>
                  </p>
                )}
                {!emailFocused && emailValid === true && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Valid email address
                  </p>
                )}
              </div>

              {/* Password */}
              <div className={`transition-all duration-200 ${passwordFocused || password ? "-translate-y-0.5" : ""}`}>
                <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:shadow-lg focus:shadow-purple-600/10 transition-all duration-200"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className={`transition-all duration-200 ${confirmPasswordFocused || confirmPassword ? "-translate-y-0.5" : ""}`}>
                <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    required
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-200 ${
                      !passwordMatch && confirmPassword
                        ? "border-red-400 focus:border-red-500 focus:shadow-red-500/10"
                        : "border-gray-200 focus:border-purple-600 focus:shadow-purple-600/10"
                    }`}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!passwordMatch && confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Passwords do not match
                  </p>
                )}
                {passwordMatch && confirmPassword && password && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Referral Code */}
              <div className={`transition-all duration-200 ${referralFocused || referral ? "-translate-y-0.5" : ""}`}>
                <label htmlFor="referral" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} />
                  Referral Code (Optional)
                </label>
                <input
                  id="referral"
                  type="text"
                  placeholder="Enter referral code"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  onFocus={() => setReferralFocused(true)}
                  onBlur={() => setReferralFocused(false)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:shadow-lg focus:shadow-purple-600/10 transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={signingUp || !fullName || !username || !email || !password || !confirmPassword || !passwordMatch}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:-translate-y-1 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {signingUp ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-purple-700 font-semibold hover:text-purple-800 hover:underline transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl mt-6">
              <Shield size={14} className="text-gray-500" />
              <span className="text-gray-600 text-xs font-medium">
                Your information is protected with enterprise-grade security
              </span>
            </div>
          </div>

          {/* Right Side Text - Hidden on Mobile */}
          <div className="hidden lg:block bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-12 max-w-md text-center">
            <img src="/logo.svg" alt="Spotix Logo" className="w-20 h-20 mx-auto mb-6 rounded-full object-cover" />
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

export default Signup