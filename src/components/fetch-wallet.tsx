"use client"

import { useState, useEffect } from "react"
import { auth } from "./lib/firebase"
import "./fetch-wallet.css"

interface WalletData {
  balance: number
  currency: string
  loading: boolean
  error: string | null
}

const FetchWallet = () => {
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    currency: "NGN",
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchUserWallet = async () => {
      const user = auth.currentUser
      if (!user) {
        setWalletData((prev) => ({
          ...prev,
          loading: false,
          error: "User not authenticated",
        }))
        return
      }

      try {
        // Get the user's ID token for authentication
        const idToken = await user.getIdToken()

        // Call the wallet API with proper authentication
        const response = await fetch("/api/v1/iwss", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (!data.error) {
            setWalletData({
              balance: data.balance || 0,
              currency: data.currency || "NGN",
              loading: false,
              error: null,
            })
          } else {
            setWalletData((prev) => ({
              ...prev,
              loading: false,
              error: data.error,
            }))
          }
        } else {
          setWalletData((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to fetch wallet data",
          }))
        }
      } catch (error) {
        console.error("Error fetching user wallet:", error)
        setWalletData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch wallet data",
        }))
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserWallet()
      } else {
        setWalletData({
          balance: 0,
          currency: "NGN",
          loading: false,
          error: "Please log in to view wallet",
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: walletData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (walletData.loading) {
    return (
      <div className="wallet-container-small">
        <div className="wallet-skeleton-small">
          <div className="wallet-skeleton-text-small"></div>
        </div>
      </div>
    )
  }

  if (walletData.error) {
    return (
      <div className="wallet-container-small error">
        <div className="wallet-error-small">
          <span className="wallet-error-text-small">{walletData.error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-container-small">
      <div className="wallet-display-small">
        <span className="wallet-balance-text">Balance: {formatBalance(walletData.balance)}</span>
      </div>
    </div>
  )
}

export default FetchWallet
