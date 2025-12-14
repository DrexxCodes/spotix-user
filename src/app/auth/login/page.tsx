"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Mail, Loader2, CheckCircle, Shield, User, X } from "lucide-react"

import { auth, db } from "../../lib/firebase"
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"

import "./login.css"

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
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
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
      setVerificationMessage("Your email has been verified successfully! You can now sign in.")

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

  const getUserFriendlyError = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-email":
      case "auth/invalid-credential":
      case "auth/user-disabled":
        return "Incorrect email or password"
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait and try again"
      case "auth/network-request-failed":
        return "Please check your internet connection and try again"
      case "auth/weak-password":
        return "Password is too weak. Please use a stronger password"
      case "auth/email-already-in-use":
        return "An account with this email already exists"
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please contact support"
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method"
      default:
        return "Unable to sign in. Please try again"
    }
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        setUnverifiedUser(user)
        setShowVerificationOption(true)
        setError("Please verify your email address before signing in.")
        setLoggingIn(false)
        return
      }

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Update last login
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: new Date().toISOString(),
        })
      }

      setEmail("")
      setPassword("")
      router.push("/home")
    } catch (error: any) {
      console.error("Login error:", error)
      setError(getUserFriendlyError(error.code))
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

      <div className="fix-login">
        <div className="auth-container">
          <div className="auth-form">
            <div className="auth-header">
              <img src="/logo.svg" alt="Spotix Logo" className="auth-logo" />
              <h1>Welcome Back</h1>
              <p className="auth-subtitle">Sign in to your account to continue</p>
            </div>

            {verificationMessage && (
              <div className="success-message verification-message">
                <CheckCircle size={18} className="message-icon" />
                <div className="message-content">
                  <p>{verificationMessage}</p>
                </div>
                <button className="dismiss-btn" onClick={() => setVerificationMessage("")} aria-label="Dismiss message">
                  <X size={18} />
                </button>
              </div>
            )}

            {error && (
              <div className="error-message">
                <AlertCircle size={18} className="message-icon" />
                <div className="message-content">
                  <p>{error}</p>
                </div>
                <button className="dismiss-btn" onClick={dismissError} aria-label="Dismiss error">
                  <X size={18} />
                </button>
              </div>
            )}

            {showVerificationOption && (
              <div className="verification-option">
                <div className="verification-header">
                  <Shield size={20} className="verification-icon" />
                  <h3>Email Verification Required</h3>
                </div>
                <p>
                  We've sent a verification link to your email address. Please check your inbox and click the link to
                  verify your account.
                </p>

                <button
                  className="resend-verification-btn"
                  onClick={handleResendVerification}
                  disabled={sendingVerification || verificationSent}
                >
                  {sendingVerification ? (
                    <>
                      <Loader2 size={16} className="loading-icon" />
                      Sending verification email...
                    </>
                  ) : verificationSent ? (
                    <>
                      <CheckCircle size={16} />
                      Verification email sent!
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Resend Verification Email
                    </>
                  )}
                </button>

                {verificationSent && (
                  <div className="verification-sent-message">
                    <p>✅ Verification email sent successfully! Please check your inbox and spam folder.</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className={`input-group ${emailFocused || email ? "focused" : ""}`}>
                <label htmlFor="email" className="input-label">
                  <User size={16} />
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
                  <Shield size={16} />
                  Password
                </label>
                <div className="password-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    autoComplete="current-password"
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

              <button type="submit" disabled={loggingIn || !email || !password} className="submit-btn">
                {loggingIn ? (
                  <>
                    <Loader2 size={18} className="loading-icon" />
                    Signing you in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="auth-links">
              <p className="auth-link">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="link-primary">
                  Create account
                </Link>
              </p>
              <p className="auth-link">
                <Link href="/auth/forgot-password" className="link-secondary">
                  Forgot your password?
                </Link>
              </p>
            </div>

            <div className="security-notice">
              <Shield size={14} />
              <span>Your information is protected with enterprise-grade security</span>
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

export default Login
