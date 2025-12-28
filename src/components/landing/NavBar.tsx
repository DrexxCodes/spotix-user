"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
  }, [menuOpen])

  const navLinks = [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#features", label: "Features" },
    { href: "#creators", label: "Creators" },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-lg shadow-lg border-b border-purple-100/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/xmas.png"
                  alt="Spotix Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span 
                className={`text-xl font-bold transition-all duration-300 ${
                  scrolled
                    ? "bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent"
                    : "text-white drop-shadow-lg"
                }`}
              >
                Spotix
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 transition-all duration-300 font-medium group ${
                    scrolled
                      ? "text-gray-700 hover:text-[#6b2fa5]"
                      : "text-white hover:text-purple-200"
                  }`}
                >
                  {link.label}
                  <span 
                    className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                      scrolled
                        ? "bg-gradient-to-r from-[#6b2fa5] to-purple-600"
                        : "bg-white"
                    }`}
                  />
                </a>
              ))}

              {/* Desktop Auth Buttons */}
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  href="/login"
                  className={`px-5 py-2.5 font-semibold rounded-lg transition-all duration-300 border-2 ${
                    scrolled
                      ? "text-[#6b2fa5] border-[#6b2fa5] hover:bg-purple-50"
                      : "text-white border-white hover:bg-white/10"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${
                scrolled
                  ? "hover:bg-purple-50"
                  : "hover:bg-white/10"
              }`}
              aria-label="Open menu"
            >
              <Menu 
                size={24} 
                className={`transition-colors duration-300 ${
                  scrolled ? "text-gray-700" : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-100">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src="/xmas.png"
                alt="Spotix Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent">
              Spotix
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-purple-50 transition-colors duration-300"
            aria-label="Close menu"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        {/* Mobile Menu Links */}
        <div className="flex flex-col p-6 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-gray-700 hover:text-[#6b2fa5] hover:bg-purple-50 rounded-lg transition-all duration-300 font-medium"
            >
              {link.label}
            </a>
          ))}

          {/* Mobile Auth Buttons */}
          <div className="pt-6 space-y-3 border-t border-purple-100 mt-4">
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="block w-full px-4 py-3 text-center text-[#6b2fa5] font-semibold border-2 border-[#6b2fa5] rounded-lg hover:bg-purple-50 transition-all duration-300"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMenuOpen(false)}
              className="block w-full px-4 py-3 text-center bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar