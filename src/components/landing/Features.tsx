"use client"

import { useState, useEffect, useRef } from "react"
import { Wallet, Users, ShieldCheck, Zap, Star, TrendingUp } from "lucide-react"

const Features = () => {
  const [featureInViews, setFeatureInViews] = useState([false, false, false, false, false, false])
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const features = [
    {
      icon: Wallet,
      title: "Secure Payments",
      description: "Fast and reliable transactions with industry-leading encryption and payment protection.",
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with like-minded event-goers and build lasting memories together.",
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      icon: ShieldCheck,
      title: "Safe & Verified",
      description: "All events are verified for authenticity. Your safety is our top priority.",
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      icon: Zap,
      title: "Instant Booking",
      description: "Book tickets in seconds with our lightning-fast checkout process.",
      color: "from-yellow-400 to-orange-500",
      bgColor: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    {
      icon: Star,
      title: "Premium Experience",
      description: "Enjoy VIP treatment with exclusive perks and early access to hot events.",
      color: "from-pink-400 to-rose-500",
      bgColor: "bg-pink-50",
      iconBg: "bg-pink-100",
      textColor: "text-pink-600",
    },
    {
      icon: TrendingUp,
      title: "Trending Events",
      description: "Stay ahead of the curve with real-time insights on the hottest events.",
      color: "from-indigo-400 to-purple-500",
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      textColor: "text-indigo-600",
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
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
            }, index * 100)
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
      }
    )

    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-[#6b2fa5] via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Why Choose Spotix?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#6b2fa5] to-purple-600 mx-auto rounded-full" />
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of event booking with our cutting-edge features
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            
            return (
              <div
                key={index}
                ref={(el) => {
                  featureRefs.current[index] = el
                }}
                className={`transition-all duration-700 ${
                  featureInViews[index]
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={`relative h-full group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-transparent overflow-hidden ${
                    hoveredIndex === index ? "scale-105 -translate-y-2" : ""
                  }`}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

                  {/* Decorative Corner Circle */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <div className={`w-full h-full ${feature.iconBg} rounded-2xl flex items-center justify-center`}>
                        <IconComponent className={`w-8 h-8 ${feature.textColor}`} />
                      </div>
                    </div>

                    {/* Animated Glow */}
                    <div
                      className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative space-y-3">
                    <h3 className="text-2xl font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-[#6b2fa5] group-hover:to-purple-600 transition-all duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Indicator Line */}
                  <div
                    className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} transition-all duration-500 ${
                      hoveredIndex === index ? "w-full" : "w-0"
                    }`}
                  />

                  {/* Number Badge */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:bg-gradient-to-br group-hover:from-[#6b2fa5] group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Floating Particles Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute top-1/4 left-1/4 w-2 h-2 ${feature.bgColor} rounded-full animate-float-slow`} />
                    <div className={`absolute top-1/3 right-1/3 w-1.5 h-1.5 ${feature.bgColor} rounded-full animate-float-medium`} />
                    <div className={`absolute bottom-1/4 right-1/4 w-2.5 h-2.5 ${feature.bgColor} rounded-full animate-float-fast`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-15px) translateX(-10px);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-25px) translateX(5px);
          }
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 3s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 3.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}

export default Features