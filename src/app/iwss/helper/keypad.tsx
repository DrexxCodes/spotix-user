"use client"

import { useState, useEffect } from "react"

interface KeypadProps {
  onComplete: (pin: string) => void
  onPinChange?: (pin: string) => void
  maxLength?: number
  label?: string
  error?: string
  loading?: boolean
  resetTrigger?: number // Add this to trigger reset from parent
}

const Keypad = ({ 
  onComplete, 
  onPinChange,
  maxLength = 4, 
  label = "Enter PIN",
  error = "",
  loading = false,
  resetTrigger = 0
}: KeypadProps) => {
  const [pin, setPin] = useState("")

  // Reset PIN when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setPin("")
    }
  }, [resetTrigger])

  useEffect(() => {
    if (onPinChange) {
      onPinChange(pin)
    }
  }, [pin, onPinChange])

  const handleNumberClick = (num: number) => {
    if (pin.length < maxLength && !loading) {
      setPin(prev => prev + num)
    }
  }

  const handleBackspace = () => {
    if (!loading) {
      setPin(prev => prev.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (!loading) {
      setPin("")
    }
  }

  const handleDone = () => {
    if (pin.length === maxLength && !loading) {
      onComplete(pin)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (loading) return

    if (e.key >= "0" && e.key <= "9") {
      handleNumberClick(parseInt(e.key))
    } else if (e.key === "Backspace") {
      handleBackspace()
    } else if (e.key === "Enter" && pin.length === maxLength) {
      handleDone()
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [pin, loading])

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Label */}
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
        
        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-2">
          {Array.from({ length: maxLength }).map((_, idx) => (
            <div
              key={idx}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                idx < pin.length
                  ? "border-[#6b2fa5] bg-purple-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              {idx < pin.length && (
                <span className="text-[#6b2fa5]">*</span>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        {/* Advisory Note */}
        {!error && pin.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Choose a unique 4-digit PIN that you'll remember
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={loading}
              className="h-16 rounded-xl bg-gray-50 hover:bg-[#6b2fa5] hover:text-white text-gray-900 text-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-[#6b2fa5]"
            >
              {num}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Clear Button */}
          <button
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
          >
            Clear
          </button>

          {/* Zero Button */}
          <button
            onClick={() => handleNumberClick(0)}
            disabled={loading}
            className="h-16 rounded-xl bg-gray-50 hover:bg-[#6b2fa5] hover:text-white text-gray-900 text-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-[#6b2fa5]"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
              />
            </svg>
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={handleDone}
          disabled={pin.length !== maxLength || loading}
          className="w-full mt-4 h-14 rounded-xl bg-[#6b2fa5] hover:bg-purple-700 text-white font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6b2fa5]"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            "Done"
          )}
        </button>
      </div>

      {/* Keyboard Support Hint */}
      <p className="text-xs text-gray-400 text-center mt-3">
        You can also use your keyboard to enter PIN
      </p>
    </div>
  )
}

export default Keypad