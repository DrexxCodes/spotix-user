import { Suspense } from "react"
import PaystackSuccessClient from "./PaystackSuccessClient"
import { Loader2 } from "lucide-react"

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait</p>
      </div>
    </div>
  )
}

export default function PaystackSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaystackSuccessClient />
    </Suspense>
  )
}