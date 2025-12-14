"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Loader2, Shield, Mail, ArrowLeft, X } from "lucide-react"

import { auth } from "../../lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"

import "./forgot.css"

type ForgotPasswordProps = {}

const ForgotPassword: React.FC<ForgotPasswordProps> = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [formTouched, setFormTouched] = useState(false)

  const router = useRouter()

  // Words for animation
  const words = ["Password", "Account", "Access", "Security", "Recovery", "Login"]

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

  // Clear error when user starts typing
  useEffect(() => {
    if (formTouched && email) {
      setError("")
    }
  }, [email, formTouched])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getUserFriendlyError = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address"
      case "auth/invalid-email":
        return "Please enter a valid email address"
      case "auth/too-many-requests":
        return "Too many reset attempts. Please wait and try again"
      case "auth/network-request-failed":
        return "Please check your internet connection and try again"
      default:
        return "Unable to send reset email. Please try again"
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setFormTouched(true)

    // Client-side validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    setResetting(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setMessage("Password reset email sent successfully! Please check your inbox and spam folder for the reset link.")

      // Clear email after successful send
      setTimeout(() => {
        setEmail("")
      }, 2000)
    } catch (err: any) {
      console.error("Password reset error:", err)
      const friendlyError = getUserFriendlyError(err.code)
      setError(friendlyError)
    } finally {
      setResetting(false)
    }
  }

  const dismissError = () => {
    setError("")
  }

  const dismissMessage = () => {
    setMessage("")
  }

  const goBackToLogin = () => {
    router.push("/auth/login")
  }

  return (
    <>
      <Head>
        <title>Reset Password | Spotix</title>
        <meta name="description" content="Reset your Spotix account password securely" />
        <link rel="canonical" href="/forgot-password" />
        <meta property="og:title" content="Reset Password | Spotix" />
        <meta property="og:description" content="Reset your Spotix account password securely" />
        <meta property="og:url" content="/forgot-password" />
      </Head>

      <div className="fix-forgot">
        <div className="auth-container">
          <div className="auth-form">
            <div className="auth-header">
              <img src="/logo.svg" alt="Spotix Logo" className="auth-logo" />
              <h1>Reset Your Password</h1>
              <p className="auth-subtitle">Enter your email to receive a password reset link</p>
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

            {message && (
              <div className="success-message">
                <CheckCircle size={18} className="message-icon" />
                <div className="message-content">
                  <p>{message}</p>
                </div>
                <button className="dismiss-btn" onClick={dismissMessage} aria-label="Dismiss message">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleReset} className="reset-form">
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

              <button type="submit" disabled={resetting || !email} className="submit-btn">
                {resetting ? (
                  <>
                    <Loader2 size={18} className="loading-icon" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>

            <div className="auth-links">
              <button onClick={goBackToLogin} className="back-to-login-btn">
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
              <p className="auth-link">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="link-primary">
                  Create account
                </Link>
              </p>
            </div>

            <div className="security-notice">
              <Shield size={14} />
              <span>Your password reset is secured with enterprise-grade encryption</span>
            </div>
          </div>

          <div className="auth-text">
            <img src="/logo.svg" alt="Spotix Logo" className="auth-logo" />
            <h2>
              Recover Your <span id="animated-text">Password</span>
            </h2>
            <p className="auth-description">
              Don't worry! It happens to the best of us. Enter your email address and we'll send you a secure link to
              reset your password.
            </p>
            <div className="forgot-illustration">
              <img src="/forgotP.svg" alt="Password Recovery" className="forgot-image" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForgotPassword
