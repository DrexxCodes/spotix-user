"use client"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"
import { useRouter } from "next/navigation"

const NotFound = () => {
  const router = useRouter()

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <img
              src="/404.svg"
              alt="404 Not Found"
              className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 drop-shadow-lg"
            />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Page Not Found
          </h1>

          <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8 max-w-xl mx-auto">
            The resource you're looking for is either not available on this particular server, the resource is still
            being developed or you might have followed a broken URL. Either way, the page is not here.
          </p>

          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
            onClick={() => router.push("/")}
          >
            Go Home
          </button>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => router.back()}
              className="text-purple-600 hover:text-purple-800 underline transition-colors"
            >
              Go Back
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={() => router.push("/home")}
              className="text-purple-600 hover:text-purple-800 underline transition-colors"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default NotFound
