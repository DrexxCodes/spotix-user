"use client"

import React, { useState, useEffect } from "react"
// import { auth, db } from "../lib/firebase"
// import { collection, getDocs, query, where } from "firebase/firestore"
import FetchWallet from "@/components/fetch-wallet"
import LoginButton from "@/components/LoginButton"

interface HeaderProps {
  isAuthenticated: boolean
  username: string
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, username }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Welcome{isAuthenticated && username ? `, ${username}` : ""} to{" "}
            <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Spotix
            </span>
            !
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
            Discover and book amazing events happening around you
          </p>
          <div className="flex justify-center">
            {isAuthenticated ? <FetchWallet /> : <LoginButton />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton component
export const HeaderSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center animate-pulse">
          <div className="h-10 sm:h-12 bg-gray-200 rounded-lg max-w-md mx-auto mb-3 sm:mb-4"></div>
          <div className="h-6 bg-gray-200 rounded-lg max-w-lg mx-auto mb-4 sm:mb-6"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

export default Header