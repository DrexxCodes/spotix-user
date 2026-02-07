"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Copy, Loader2 } from "lucide-react"
import Image from "next/image"
import { auth } from "@/app/lib/firebase"

interface TelegramBotProps {
  telegramConnected: boolean
  telegramUsername: string | null
  userId: string
  onConnectionStatusChange: (connected: boolean, username: string | null) => void
}

export default function TelegramBot({
  telegramConnected,
  telegramUsername,
  userId,
  onConnectionStatusChange,
}: TelegramBotProps) {
  const [connecting, setConnecting] = useState(false)
  const [connectionToken, setConnectionToken] = useState<string | null>(null)
  const [tokenCopySuccess, setTokenCopySuccess] = useState(false)
  const [isConnected, setIsConnected] = useState(telegramConnected)
  const [username, setUsername] = useState(telegramUsername)

  useEffect(() => {
    setIsConnected(telegramConnected)
    setUsername(telegramUsername)
  }, [telegramConnected, telegramUsername])

  const handleGenerateToken = async () => {
    setConnecting(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/v1/user/${userId}/bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: "generate" }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setConnectionToken(data.token)
      } else {
        alert(data.error || "Failed to generate connection token")
      }
    } catch (error) {
      console.error("Error generating token:", error)
      alert("An error occurred while generating token")
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Telegram account?")) {
      return
    }

    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/v1/user/${userId}/bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: "disconnect" }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsConnected(false)
        setUsername(null)
        onConnectionStatusChange(false, null)
      } else {
        alert(data.error || "Failed to disconnect")
      }
    } catch (error) {
      console.error("Error disconnecting:", error)
      alert("An error occurred while disconnecting")
    }
  }

  const copyConnectionToken = () => {
    if (connectionToken) {
      navigator.clipboard.writeText(connectionToken)
      setTokenCopySuccess(true)
      setTimeout(() => setTokenCopySuccess(false), 2000)
    }
  }

  const handleProceedToBot = () => {
    window.open("https://t.me/SpotixBot", "_blank")
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Image src="/telegram-logo.png" alt="Telegram" width={32} height={32} />
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Telegram Bot</h2>
        <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide animate-pulse">
          New
        </span>
      </div>

      <div className="bg-gradient-to-br from-[#0088cc] to-[#229ed9] rounded-xl p-6 text-white">
        {!isConnected ? (
          <div>
            <p className="mb-6 text-white/90 leading-relaxed">
              Connect your Telegram account to receive event notifications, ticket updates, and manage your Spotix
              account through our bot.
            </p>

            {!connectionToken ? (
              <button
                type="button"
                onClick={handleGenerateToken}
                disabled={connecting}
                className="w-full sm:w-auto px-6 py-3 bg-white/20 border-2 border-white/30 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all font-semibold flex items-center justify-center gap-3"
              >
                <Image src="/telegram-logo.png" alt="Telegram" width={24} height={24} />
                {connecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Connection Token"
                )}
              </button>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    🔑 Connection Token Generated
                  </h4>
                  <p className="text-white/90 text-sm mb-4">
                    Copy the token below and use the{" "}
                    <code className="bg-white/20 px-2 py-1 rounded">/connect</code> command in our Telegram bot:
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <code className="flex-1 bg-white/10 px-4 py-3 rounded-lg text-sm font-mono break-all border border-white/20">
                      {connectionToken}
                    </code>
                    <button
                      type="button"
                      onClick={copyConnectionToken}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium whitespace-nowrap ${
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

                <div className="flex flex-col sm:flex-row gap-3">
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
                      setConnectionToken(null)
                      setConnecting(false)
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center p-2">
                    <Image src="/telegram-logo.png" alt="Telegram" width={32} height={32} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">@{username}</p>
                    <p className="text-white/80 text-sm">Connected to Spotix Bot</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
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
  )
}