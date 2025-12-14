"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Shield, User, Mail, Lock, Users, X } from "lucide-react"
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { auth, db } from "../../lib/firebase"

import "./signup.css"

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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [verifyingReferral, setVerifyingReferral] = useState(false)
  const [referralVerified, setReferralVerified] = useState(false)
  const [referrerUsername, setReferrerUsername] = useState("")
  const [formTouched, setFormTouched] = useState(false)

  // Focus states for better UX
  const [fullNameFocused, setFullNameFocused] = useState(false)
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [referralFocused, setReferralFocused] = useState(false)

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

  // Clear errors when user starts typing
  useEffect(() => {
    if (formTouched && (email || password || fullName || username)) {
      setError("")
    }
  }, [email, password, fullName, username, formTouched])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getUserFriendlyError = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please try logging in instead"
      case "auth/weak-password":
        return "Please choose a stronger password with at least 6 characters"
      case "auth/invalid-email":
        return "Please enter a valid email address"
      case "auth/operation-not-allowed":
        return "Account creation is temporarily disabled. Please try again later"
      case "auth/network-request-failed":
        return "Please check your internet connection and try again"
      case "auth/too-many-requests":
        return "Too many signup attempts. Please wait and try again"
      default:
        return "Unable to create your account. Please try again"
    }
  }

  // Check if a referral code exists and get the referrer's username
  const checkReferralCode = async (referralCode: string) => {
    if (!referralCode.trim()) return { valid: true, username: "", referralData: null }

    setVerifyingReferral(true)
    try {
      const referralDocRef = doc(db, "referrals", referralCode.trim())
      const referralDoc = await getDoc(referralDocRef)

      if (!referralDoc.exists()) {
        setError("The referral code you entered doesn't exist. You can continue signing up without it")
        setReferralVerified(false)
        setReferrerUsername("")
        return { valid: false, username: "", referralData: null }
      }

      const referralData = referralDoc.data()
      const referrerUsername = referralData.username || ""

      setReferralVerified(true)
      setReferrerUsername(referrerUsername)
      setError("")

      return { valid: true, username: referrerUsername, referralData }
    } catch (error) {
      console.error("Error checking referral code:", error)
      setReferralVerified(false)
      setReferrerUsername("")
      setError("Unable to verify referral code. You can continue signing up without it")
      return { valid: true, username: "", referralData: null }
    } finally {
      setVerifyingReferral(false)
    }
  }

  const handleReferralBlur = async () => {
    if (referral.trim()) {
      await checkReferralCode(referral)
    } else {
      setReferralVerified(false)
      setReferrerUsername("")
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
      setError("Please enter a valid email address")
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

    // Check if referral code is valid if provided
    if (referral.trim()) {
      const { valid, username } = await checkReferralCode(referral)
      if (!valid) {
        return
      }
      setReferrerUsername(username)
    }

    setSigningUp(true)

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with username
      await updateProfile(user, { displayName: username })

      // Send Firebase verification email
      setSendingEmail(true)
      await sendEmailVerification(user)

      // Store user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        username,
        email,
        referralCodeUsed: referral.trim() || null,
        referredBy: referrerUsername || null,
        isBooker: false,
        wallet: 0.0,
        createdAt: serverTimestamp(),
        emailVerified: false,
      })

      // Process referral if provided
      if (referral.trim()) {
        try {
          const referralDocRef = doc(db, "referrals", referral.trim())
          const referralDoc = await getDoc(referralDocRef)

          if (referralDoc.exists()) {
            const referralData = referralDoc.data()

            const newReferredUser = {
              username: username,
              email: email,
              fullName: fullName,
              joinedAt: new Date().toISOString(),
              userId: user.uid,
            }

            await updateDoc(referralDocRef, {
              referredUsers: arrayUnion(newReferredUser),
              refGain: (referralData.refGain || 0) + 200,
              totalReferrals: (referralData.totalReferrals || 0) + 1,
              lastReferralAt: serverTimestamp(),
            })

            setSuccess(`Successfully signed up using ${referralData.username}'s referral code!`)
          }
        } catch (referralError) {
          console.error("Error processing referral during signup:", referralError)
        }
      }

      // Clear form
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setFullName("")
      setUsername("")
      setReferral("")

      // Redirect to login with verification message
      router.push("/auth/login?verified=true")
    } catch (err: any) {
      console.error("Signup error:", err)
      const friendlyError = getUserFriendlyError(err.code)
      setError(friendlyError)
      setSigningUp(false)
    } finally {
      setSendingEmail(false)
      setSigningUp(false)
    }
  }

  const dismissError = () => {
    setError("")
  }

  const dismissSuccess = () => {
    setSuccess("")
  }

  return (
    <>
      <Head>
        <title>Create Account | Spotix</title>
        <meta name="description" content="Join Spotix and start your event management journey today" />
      </Head>

      <div className="fix-signup">
        <div className="auth-container">
          <div className="form-scroll-container">
            <div className="auth-form">
              <div className="auth-header">
                <img src="/logo.svg" alt="Spotix Logo" className="auth-logo" />
                <h1>Create Your Account</h1>
                <p className="auth-subtitle">Join thousands of event organizers on Spotix</p>
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={18} className="message-icon" />
                  <div className="message-content">
                    <p>{error}</p>
                  </div>
                  <button className="dismiss-btn" onClick={dismissError} aria-label="Dismiss error">
                    <X size={16} />
                  </button>
                </div>
              )}

              {success && (
                <div className="success-message">
                  <CheckCircle size={18} className="message-icon" />
                  <div className="message-content">
                    <p>{success}</p>
                  </div>
                  <button className="dismiss-btn" onClick={dismissSuccess} aria-label="Dismiss message">
                    <X size={16} />
                  </button>
                </div>
              )}

              {sendingEmail && (
                <div className="info-message">
                  <Loader2 size={18} className="loading-icon" />
                  <div className="message-content">
                    <p>Sending verification email...</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignup} className="signup-form">
                <div className={`input-group ${fullNameFocused || fullName ? "focused" : ""}`}>
                  <label htmlFor="fullName" className="input-label">
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
                    className="form-input"
                  />
                </div>

                <div className={`input-group ${usernameFocused || username ? "focused" : ""}`}>
                  <label htmlFor="username" className="input-label">
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
                    className="form-input"
                    minLength={3}
                  />
                </div>

                <div className={`input-group ${emailFocused || email ? "focused" : ""}`}>
                  <label htmlFor="email" className="input-label">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    autoComplete="email"
                    className="form-input"
                  />
                </div>

                <div className={`input-group ${passwordFocused || password ? "focused" : ""}`}>
                  <label htmlFor="password" className="input-label">
                    <Lock size={16} />
                    Password
                  </label>
                  <div className="password-container">
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
                      className="form-input"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={`input-group ${confirmPasswordFocused || confirmPassword ? "focused" : ""}`}>
                  <label htmlFor="confirmPassword" className="input-label">
                    <Lock size={16} />
                    Confirm Password
                  </label>
                  <div className="password-container">
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
                      className="form-input"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={`input-group ${referralFocused || referral ? "focused" : ""}`}>
                  <label htmlFor="referral" className="input-label">
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
                    onBlur={() => {
                      setReferralFocused(false)
                      handleReferralBlur()
                    }}
                    className="form-input"
                  />
                  {referralVerified && referrerUsername && (
                    <div className="referral-success">
                      <CheckCircle size={14} />
                      <span>Valid referral from {referrerUsername}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    signingUp || sendingEmail || !fullName || !username || !email || !password || !confirmPassword
                  }
                  className="submit-btn"
                >
                  {signingUp ? (
                    <>
                      <Loader2 size={18} className="loading-icon" />
                      Creating your account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="auth-links">
                <p className="auth-link">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="link-primary">
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="security-notice">
                <Shield size={14} />
                <span>Your information is protected with enterprise-grade security</span>
              </div>
            </div>
          </div>

          <div className="auth-text">
            <img src="/logo.svg" alt="Spotix Logo" className="auth-logo" />
            <h2>
              Use Spotix to Book That <span id="animated-text">Event</span>
            </h2>
            <p className="auth-description">
              Join thousands of event organizers who trust Spotix for seamless event management and booking experiences.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Signup
