"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, DollarSign, BarChart, ArrowRight, Sparkles, TrendingUp } from "lucide-react"

const BookerCTA = () => {
  const [isInView, setIsInView] = useState(false)
  const [contentInView, setContentInView] = useState(false)
  const [imageInView, setImageInView] = useState(false)
  const [featureInViews, setFeatureInViews] = useState([false, false, false])
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])

  const bookerFeatures = [
    {
      icon: Calendar,
      title: "Create Events",
      description: "Easily create and manage your events with our intuitive dashboard.",
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: DollarSign,
      title: "Sell Tickets",
      description: "Set up ticket types, prices, and manage sales all in one place.",
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50",
    },
    {
      icon: BarChart,
      title: "Track Analytics",
      description: "Get detailed insights on ticket sales, attendee demographics, and more.",
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50",
    },
  ]

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          setTimeout(() => setContentInView(true), 200)
          setTimeout(() => setImageInView(true), 400)
        }
      },
      { threshold: 0.2 }
    )

    const featureObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = featureRefs.current.findIndex((ref) => ref === entry.target)
          if (index !== -1 && entry.isIntersecting) {
            setTimeout(() => {
              setFeatureInViews((prev) => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
            }, index * 150)
          }
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) sectionObserver.observe(sectionRef.current)
    featureRefs.current.forEach((ref) => {
      if (ref) featureObserver.observe(ref)
    })

    return () => {
      sectionObserver.disconnect()
      featureObserver.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-[#6b2fa5] to-purple-800 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-300 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
      </div>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content Side */}
          <div
            ref={contentRef}
            className={`space-y-8 transition-all duration-1000 ${
              contentInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold text-white">For Event Organizers</span>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Become a{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    Booker
                  </span>
                  <div className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-300/30 -rotate-1" />
                </span>
              </h2>
              <p className="text-xl text-purple-100">
                Are you an event organizer? Join Spotix as a booker and start creating and managing your own events.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {bookerFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={index}
                    ref={(el) => {
                      featureRefs.current[index] = el
                    }}
                    className={`group relative transition-all duration-700 ${
                      featureInViews[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <div className={`flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 ${
                      hoveredFeature === index ? "scale-105 shadow-2xl" : ""
                    }`}>
                      {/* Icon */}
                      <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 transition-all duration-300 ${
                        hoveredFeature === index ? "rotate-6 scale-110" : ""
                      }`}>
                        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-[#6b2fa5]" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-purple-100 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Arrow Indicator */}
                      <ArrowRight className={`w-5 h-5 text-white transition-all duration-300 ${
                        hoveredFeature === index ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      }`} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/createevent"
                className="group relative px-8 py-4 bg-white text-[#6b2fa5] rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Create Event
                  <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <Link
                href="/bookerRole"
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-full font-bold text-lg transition-all duration-300 hover:bg-white hover:text-[#6b2fa5] hover:scale-105 hover:shadow-xl"
              >
                <span className="flex items-center justify-center gap-2">
                  Learn More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* Image Side */}
          <div
            ref={imageRef}
            className={`relative transition-all duration-1000 ${
              imageInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "3s" }} />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s", animationDelay: "1s" }} />

            {/* Image Container */}
            <div className="relative group">
              {/* Glowing Border */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-300 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              
              {/* Image */}
              <div className="relative rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <div className="relative aspect-square">
                  <Image
                    src="/BookerSS.png"
                    alt="Booker Dashboard"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6b2fa5]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-full shadow-2xl flex items-center gap-2 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-bold text-gray-800">Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BookerCTA