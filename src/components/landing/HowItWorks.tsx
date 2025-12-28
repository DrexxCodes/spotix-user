"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle, Calendar, Ticket, ArrowRight, Sparkles } from "lucide-react"

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [stepInViews, setStepInViews] = useState([false, false, false])
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  const steps = [
    {
      icon: CheckCircle,
      title: "Sign Up",
      description: "Create your free Spotix account in seconds and join our community of event-goers.",
      color: "from-green-400 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      number: "01",
    },
    {
      icon: Calendar,
      title: "Find Events",
      description: "Discover exciting events happening near you with our intuitive search and filter options. Spot the event that matches your vibe.",
      color: "from-purple-400 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      number: "02",
    },
    {
      icon: Ticket,
      title: "Book & Attend",
      description: "Secure your tickets with our seamless booking process and enjoy the event, easy as pie!",
      color: "from-blue-400 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      number: "03",
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = stepRefs.current.findIndex((ref) => ref === entry.target)
          if (index !== -1 && entry.isIntersecting) {
            setTimeout(() => {
              setStepInViews((prev) => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
            }, index * 200) // Stagger the animations
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -100px 0px",
      }
    )

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white via-purple-50/20 to-white"
    >
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600">Simple Process</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-[#6b2fa5] via-purple-600 to-pink-500 bg-clip-text text-transparent">
            How It Works
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with Spotix in three simple steps and unlock a world of amazing events
          </p>
        </div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connection Lines (Desktop) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-green-200 via-purple-200 to-blue-200 -z-10" style={{ width: 'calc(100% - 12rem)', left: '6rem' }} />
          
          {steps.map((step, index) => {
            const IconComponent = step.icon
            
            return (
              <div
                key={index}
                ref={(el) => {
                  stepRefs.current[index] = el
                }}
                className={`relative transition-all duration-700 ${
                  stepInViews[index]
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Step Card */}
                <div
                  className={`relative group h-full bg-white rounded-3xl border-2 ${step.borderColor} p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                    activeStep === index ? "shadow-2xl -translate-y-2 scale-105" : "shadow-lg"
                  }`}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.bgGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-purple-200 flex items-center justify-center shadow-lg z-10">
                    <span className="text-lg font-bold bg-gradient-to-r from-[#6b2fa5] to-purple-600 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 mx-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                      <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                        <IconComponent className={`w-10 h-10 ${step.iconColor}`} />
                      </div>
                    </div>
                    
                    {/* Animated Glow Effect */}
                    <div className={`absolute inset-0 w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`} />
                  </div>

                  {/* Content */}
                  <div className="relative space-y-4">
                    <h3 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Hover Arrow Indicator */}
                    <div className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
                      activeStep === index 
                        ? "opacity-100 translate-x-0" 
                        : "opacity-0 -translate-x-4"
                    }`}>
                      <span className={`bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                        Learn more
                      </span>
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>

                  {/* Decorative Corner Elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full`} />
                  </div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 opacity-5 group-hover:opacity-10 transition-opacity">
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full`} />
                  </div>
                </div>

                {/* Arrow Between Steps (Desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-24 -right-6 lg:-right-12 w-12 lg:w-24 items-center justify-center z-20">
                    <div className={`transition-all duration-700 ${
                      stepInViews[index] ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    }`}>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center animate-pulse`}>
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-20 transition-all duration-1000 ${
          stepInViews[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <p className="text-lg text-gray-600 mb-6">
            Ready to discover amazing events?
          </p>
          <button className="group relative px-10 py-4 bg-gradient-to-r from-[#6b2fa5] to-purple-600 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks