"use client"

import { Copy } from "lucide-react"
import { useState } from "react"

interface UserIdProps {
  userId: string
}

export default function UserId({ userId }: UserIdProps) {
  const [copied, setCopied] = useState(false)

  const copyUserId = () => {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 lg:p-8 border border-purple-200">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">User ID</h2>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <code className="flex-1 bg-white px-4 py-3 rounded-lg text-sm font-mono text-gray-900 border border-purple-200 break-all">
          {userId}
        </code>
        
        <button
          type="button"
          onClick={copyUserId}
          className={`px-4 py-3 rounded-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap ${
            copied
              ? "bg-green-500 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          <Copy size={18} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-3">
        This is your unique identifier in the Spotix platform
      </p>
    </div>
  )
}