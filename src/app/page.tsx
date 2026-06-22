"use client"

import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  const features = [
    { icon: "🛒", title: "Smart POS", desc: "Fast billing with batch & barcode support" },
    { icon: "📦", title: "Inventory Management", desc: "Track stock, expiry dates & low stock alerts" },
    { icon: "🤖", title: "AI Business Assistant", desc: "Ask questions about your sales & profit in Sinhala/English" },
    { icon: "📊", title: "Reports & Analytics", desc: "Daily & monthly profit tracking" },
    { icon: "👥", title: "Customer & Supplier Ledger", desc: "Manage credit sales & outstanding balances" },
    { icon: "🖨️", title: "Receipt Printing", desc: "Bluetooth/USB thermal printer support" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-white">
          Desh<span className="text-blue-400">POS</span>
        </h1>
        <div className="flex gap-3">
          <button onClick={() => router.push("/login")}
            className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium">
            Sign In
          </button>
          <button onClick={() => router.push("/register")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-6 py-16">
        <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
          🇱🇰 Made for Sri Lankan Retail Businesses
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mt-6 leading-tight">
          The Smartest POS System for Your Shop
        </h2>
        <p className="text-slate-400 text-lg mt-4 max-w-2xl mx-auto">
          DeshPos helps retail shops manage sales, inventory, customers & profits — 
          with an AI assistant that understands your business in Sinhala.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <button onClick={() => router.push("/register")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl">
            🚀 Start Free Trial — 30 Days
          </button>
          <button onClick={() => router.push("/login")}
            className="px-6 py-3 border border-slate-600 text-slate-300 hover:text-white font-semibold rounded-xl">
            Sign In
          </button>
        </div>
        <p className="text-slate-500 text-xs mt-3">No credit card required to start</p>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <p className="text-3xl mb-3">{f.icon}</p>
              <p className="text-white font-semibold text-sm">{f.title}</p>
              <p className="text-slate-400 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-xs">Simple Pricing</p>
          <p className="text-white font-black text-4xl mt-2">Rs.1,000</p>
          <p className="text-slate-500 text-xs">/ month, after 30-day free trial</p>
          <button onClick={() => router.push("/register")}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl">
            Start Free Trial
          </button>
        </div>
      </div>

      {/* Developer / About */}
      <div className="max-w-3xl mx-auto px-6 py-12 border-t border-slate-800">
        <h3 className="text-white font-bold text-lg text-center mb-6">About the Developer</h3>
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
            A
          </div>
          <p className="text-white font-semibold mt-3">Achintha Deshan</p>
          <p className="text-slate-400 text-sm">Full Stack Developer — Desh Tech</p>
          <p className="text-slate-500 text-xs mt-3 max-w-md mx-auto">
            Built with Next.js, Express.js, PostgreSQL & Groq AI — 
            designed specifically for Sri Lankan small & medium retail businesses.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center">
        <p className="text-slate-500 text-xs">© 2026 Desh Tech. All rights reserved.</p>
      </footer>
    </div>
  )
}