"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/landing/NavBar"
import { Footer } from "@/components/landing/footer"
import { 
  Ticket, 
  Vote, 
  ShoppingBag, 
  Palette, 
  Globe, 
  Mail, 
  CreditCard,
  Check,
  MessageCircle,
  ChevronRight
} from "lucide-react"

export default function PricingClient() {
  const primaryPricing = {
    title: "Event Tickets",
    rate: "5% + ₦100",
    subtitle: "per ticket sold",
    description: "For every paid event ticket purchased on Spotix Web, Spotix Bot, Spotix App, or via the Spotix API system, we reserve a transparent service fee of 5% plus ₦100.",
    icon: Ticket,
    features: [
      "Instant QR code ticket delivery",
      "Real-time sales tracking",
      "Secure payment processing",
      "24/7 customer support",
      "No hidden charges"
    ]
  }

  const secondaryPricing = [
    {
      title: "Voting Rates",
      rate: "10%",
      subtitle: "per vote",
      description: "We collect 10% of every paid voting fee across Spotix Web and Spotix Bot, ensuring fair and transparent voting systems for your events.",
      icon: Vote,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Merchandise Rates",
      rate: "10%",
      subtitle: "per sale",
      description: "We collect 10% of every merchandise item sold across Spotix Web and Spotix Bot, helping you manage event merch seamlessly.",
      icon: ShoppingBag,
      color: "from-green-500 to-green-600"
    }
  ]

  const auxiliaryServices = [
    {
      title: "Graphics Design",
      description: "Need a stunning design flyer for your event? Our expert designers have you covered! Get professional, eye-catching graphics that make your event stand out.",
      icon: Palette,
      pricing: "Contact for quote",
      features: ["Professional event flyers", "Social media graphics", "Promotional banners", "Fast turnaround time"]
    },
    {
      title: "Custom Event Page",
      description: "Build on the Spotix Event API to create fully customized event pages tailored to your brand. Perfect for enterprises and large-scale events.",
      icon: Globe,
      pricing: "Contact for quote",
      features: ["Full API access", "Custom branding", "Advanced analytics", "Priority support"]
    },
    {
      title: "Branded Email",
      description: "Why create an entire Gmail account for your event when you can get one on Spotix? Rent or own a professional email address. The choice is yours!",
      icon: Mail,
      pricing: "Contact for quote",
      features: ["your-event@booker.spotix.com.ng", "Professional appearance", "Integrated with platform", "Flexible rent or buy options"],
      example: "your-event-name@booker.spotix.com.ng"
    },
    {
      title: "Spotix Smart Card",
      description: "One card, any event. Pay for any event on Spotix and have it automatically linked to your card. The ultimate convenience for frequent event-goers.",
      icon: CreditCard,
      pricing: "Contact for quote",
      features: ["Universal event access", "Contactless payments", "Auto-sync with account", "Exclusive cardholder perks"]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#6b2fa5] via-purple-700 to-purple-600 text-white py-20 md:py-28 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/spotix-placeholder.png"
            alt="Spotix Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-purple-100 mb-6 text-sm md:text-base">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={16} />
            <span className="relative inline-flex items-center justify-center px-2">
              <span className="relative z-10 px-1">Pricing</span>
              {/* Animated Dotted Circle */}
              <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: '8s' }} viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="4 6"
                  className="text-purple-200 opacity-60"
                />
              </svg>
            </span>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Transparent Pricing,
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100 bg-clip-text text-transparent">
                No Hidden Fees
              </span>
            </h1>
            <p className="text-lg md:text-xl text-purple-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Simple, straightforward pricing that grows with your events. Only pay for what you use, with complete transparency every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        
        {/* Primary Pricing - Event Tickets */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-[#6b2fa5]/10 text-[#6b2fa5] rounded-full text-sm font-semibold mb-4">
              Primary Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Core Event Ticketing</h2>
            <p className="text-gray-600 text-lg">Our main service with the best rates in Nigeria</p>
          </div>

          <div className="bg-gradient-to-br from-[#6b2fa5] to-purple-700 rounded-3xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-white">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                    <Ticket size={32} className="text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-3">{primaryPricing.title}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl md:text-6xl font-bold text-yellow-300">{primaryPricing.rate}</span>
                    <span className="text-xl text-purple-100">{primaryPricing.subtitle}</span>
                  </div>
                  <p className="text-purple-100 text-lg leading-relaxed mb-6">
                    {primaryPricing.description}
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-3">
                    {primaryPricing.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Element */}
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-pink-300 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-2">5%</div>
                        <div className="text-2xl text-yellow-300 font-semibold mb-4">+ ₦100</div>
                        <div className="text-purple-100 text-sm">Per Ticket Fee</div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/20">
                        <div className="text-sm text-purple-100 mb-2">Example calculation:</div>
                        <div className="bg-white/10 rounded-lg p-3 text-white text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Ticket Price:</span>
                            <span className="font-semibold">₦10,000</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Spotix Fee:</span>
                            <span className="font-semibold">₦600</span>
                          </div>
                          <div className="border-t border-white/20 my-2"></div>
                          <div className="flex justify-between font-bold">
                            <span>You Receive:</span>
                            <span className="text-yellow-300">₦9,400</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Pricing */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Secondary Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Additional Revenue Streams</h2>
            <p className="text-gray-600 text-lg">Maximize your event monetization with voting and merchandise</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {secondaryPricing.map((service, index) => {
              const Icon = service.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100"
                >
                  <div className={`h-2 bg-gradient-to-r ${service.color}`}></div>
                  <div className="p-8">
                    <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${service.color} rounded-xl mb-6 shadow-lg`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold text-gray-900">{service.rate}</span>
                      <span className="text-lg text-gray-600">{service.subtitle}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Auxiliary Pricing */}
        <div>
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              Auxiliary Services
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Premium Add-Ons</h2>
            <p className="text-gray-600 text-lg">Take your events to the next level with our professional services</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {auxiliaryServices.map((service, index) => {
              const Icon = service.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#6b2fa5]/10 rounded-xl">
                        <Icon size={24} className="text-[#6b2fa5]" />
                      </div>
                      <span className="text-sm font-semibold text-[#6b2fa5] bg-[#6b2fa5]/10 px-3 py-1 rounded-full">
                        {service.pricing}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
                    
                    {service.example && (
                      <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Example:</div>
                        <code className="text-sm text-[#6b2fa5] font-mono">{service.example}</code>
                      </div>
                    )}

                    {/* Features */}
                    <div className="space-y-2">
                      {service.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-start gap-2">
                          <Check size={16} className="text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20">
          <div className="bg-gradient-to-br from-[#6b2fa5] to-purple-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-12 md:p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Have Questions About Pricing?
              </h2>
              <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
                Our team is ready to help you understand our pricing and find the best solution for your events. Chat with us now!
              </p>
              <a
                href="https://tawk.to/spotix"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#6b2fa5] font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <MessageCircle size={20} />
                Chat With Our Team
                <ChevronRight size={20} />
              </a>
              <div className="mt-6 text-purple-100 text-sm">
                Average response time: Less than 2 minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}