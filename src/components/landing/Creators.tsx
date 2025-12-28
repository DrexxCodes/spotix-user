"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Linkedin, Twitter, Mail, Sparkles } from "lucide-react"

const Creators = () => {
  const [creatorInViews, setCreatorInViews] = useState([false, false])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const creatorRefs = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  const creators = [
    {
      name: "Ezene Chidebere Bryan",
      title: "CEO / Founder",
      image: "/bryan.png",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "bryan@spotix.com",
      },
    },
    {
      name: "Onyekwelu Michael (Drexx)",
      title: "Co-Founder / Snr Engineer",
      image: "/drexx.png",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "drexx@spotix.com",
      },
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = creatorRefs.current.findIndex((ref) => ref === entry.target)
          if (index !== -1 && entry.isIntersecting) {
            setTimeout(() => {
              setCreatorInViews((prev) => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
            }, index * 300)
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -100px 0px",
      }
    )

    creatorRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="creators"
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-200/10 to-pink-200/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600">The Visionaries</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-[#6b2fa5] via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Meet The Founders
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The passionate minds behind Spotix, dedicated to revolutionizing the event experience
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {creators.map((creator, index) => (
            <div
              key={index}
              ref={(el) => {
                creatorRefs.current[index] = el
              }}
              className={`transition-all duration-1000 ${
                creatorInViews[index]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-16"
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-[#6b2fa5] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                
                <div className="relative bg-white rounded-3xl p-8 m-0.5">
                  {/* Top Gradient Bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-[#6b2fa5]" />

                  {/* Content Container */}
                  <div className="flex flex-col items-center text-center">
                    {/* Image Container */}
                    <div className="relative mb-6">
                      {/* Animated Ring */}
                      <div className="absolute inset-0 -m-2 rounded-full bg-[#6b2fa5] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                      
                      {/* Image Wrapper with Gradient Border */}
                      <div className="relative p-1 rounded-full bg-[#6b2fa5]">
                        <div className="relative w-48 h-48 rounded-full overflow-hidden bg-white p-1">
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            <Image
                              src={creator.image}
                              alt={creator.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 192px, 192px"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#6b2fa5] text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap transform transition-all duration-500 ${
                        hoveredIndex === index ? "scale-110" : "scale-100"
                      }`}>
                        {creator.title}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2 mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 group-hover:text-[#6b2fa5] transition-all duration-300">
                        {creator.name}
                      </h3>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                      <a
                        href={creator.social.linkedin}
                        className="p-3 rounded-full bg-purple-50 hover:bg-[#6b2fa5] text-gray-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group/icon"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                      <a
                        href={creator.social.twitter}
                        className="p-3 rounded-full bg-purple-50 hover:bg-[#6b2fa5] text-gray-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group/icon"
                        aria-label="Twitter"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a
                        href={`mailto:${creator.social.email}`}
                        className="p-3 rounded-full bg-purple-50 hover:bg-[#6b2fa5] text-gray-600 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group/icon"
                        aria-label="Email"
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-4 left-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity">
                      <div className="absolute inset-0 bg-[#6b2fa5] rounded-full" />
                    </div>
                    <div className="absolute top-20 right-4 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
                      <div className="absolute inset-0 bg-[#6b2fa5] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-20 transition-all duration-1000 ${
          creatorInViews[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <p className="text-lg text-gray-600 mb-6">
            Want to learn more about our journey?
          </p>
          <button className="group relative px-10 py-4 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              Read Our Story
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Creators