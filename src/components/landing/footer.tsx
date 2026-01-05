"use client"

import Image from "next/image"
import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      {/* Boxicons CSS */}
      <link 
        href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" 
        rel="stylesheet"
      />
      
      <footer className="bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-700 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <Image
                  src="/logo.png"
                  alt="Spotix Logo"
                  width={150}
                  height={40}
                  className="mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ color: '#6b2fa5' }}>Spotix</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The premier event management platform empowering bookers to create, monitor, and manage events with ease. 
                  Streamline your ticketing, track sales in real-time, and deliver exceptional experiences to your attendees.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Platform Active</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-gray-900 font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ background: '#6b2fa5' }}></div>
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/create-event" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-calendar bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>Create Event</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/events" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-show bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>All Events</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/verify-ticket" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-check-circle bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>Verify Tickets</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-gray-900 font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ background: '#6b2fa5' }}></div>
                Resources
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/privacy" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-lock-alt bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-file bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>Terms of Service</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/knowledge-base" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-book-open bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>Knowledge Base</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/data-protection" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <i className="bx bx-shield-alt-2 bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    <span>Data Protection Policy</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h4 className="text-gray-900 font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ background: '#6b2fa5' }}></div>
                Get in Touch
              </h4>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <i className="bx bx-support bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                  Have questions or need support?
                </p>
                <a 
                  href="mailto:support@spotix.com" 
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <i className="bx bx-envelope bx-tada text-xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                  support@spotix.com
                </a>
                <div className="pt-4">
                  <p className="text-xs mb-3 flex items-center gap-2">
                    <i className="bx bx-share-alt text-lg" style={{ color: '#6b2fa5' }}></i>
                    Follow us
                  </p>
                  <div className="flex gap-3">
                    <a 
                      href="https://twitter.com/spotix" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-200 hover:bg-purple-100 flex items-center justify-center transition-all group"
                    >
                      <i className="bx bxl-twitter bx-tada text-2xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    </a>
                    <a 
                      href="https://linkedin.com/company/spotix" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-200 hover:bg-purple-100 flex items-center justify-center transition-all group"
                    >
                      <i className="bx bxl-linkedin bx-tada text-2xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    </a>
                    <a 
                      href="https://instagram.com/spotix" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-200 hover:bg-purple-100 flex items-center justify-center transition-all group"
                    >
                      <i className="bx bxl-instagram bx-tada text-2xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    </a>
                    <a 
                      href="https://facebook.com/spotix" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-200 hover:bg-purple-100 flex items-center justify-center transition-all group"
                    >
                      <i className="bx bxl-facebook bx-tada text-2xl group-hover:bx-tada" style={{ color: '#6b2fa5' }}></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 mt-8 border-t border-gray-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <i className="bx bx-copyright text-lg" style={{ color: '#6b2fa5' }}></i>
                {currentYear} <span style={{ color: '#6b2fa5' }} className="font-semibold">Spotix Technologies</span>. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Made with</span>
                <i className="bx bxs-heart bx-tada" style={{ color: '#6b2fa5' }}></i>
                <span>for event creators worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}