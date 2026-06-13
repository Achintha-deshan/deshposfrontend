"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { register } from "../../services/auth"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [conPassword, setConPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !conPassword) {
      return setError("Please fill all fields!")
    }
    if (password !== conPassword) {
      return setError("Passwords do not match!")
    }
    try {
      setLoading(true)
      setError("")
      const res = await register(name, email, phone, password)
       
      localStorage.setItem("ACCESS_TOKEN", res.data.accessToken)
      localStorage.setItem("REFRESH_TOKEN", res.data.refreshToken)

        router.push("/onboarding")
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight">
            Desh<span className="text-blue-400">POS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Full Name</label>
              <input
                type="text"
                placeholder="John Perera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition text-sm"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition text-sm"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition text-sm"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition text-sm"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={conPassword}
                onChange={(e) => setConPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition text-sm"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm shadow-lg shadow-blue-500/25"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-slate-500 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-400 font-semibold hover:text-blue-300 transition"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}