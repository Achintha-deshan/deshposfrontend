"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { login } from "../../services/auth"
import { setTokens, setUser } from "../../redux/slices/authSlice"
import { AppDispatch } from "../../redux/store"

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!identifier || !password) {
      return setError("Please fill all fields!")
    }
    try {
      setLoading(true)
      setError("")
      const res = await login(identifier, password)
      dispatch(setTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }))
      dispatch(setUser(res.data))
       
      const roles: string[] =  res.data.roles || []

      if (roles.includes("OWNER")) {
         if (res.data.hasBusinessSetup) { 
           router.push("/dashboard")
        }else{
          router.push("/onboarding")
        }
      } else {
        router.push("/dashboard")
}
     } catch (err: any) {
      setError(err.response?.data?.message || "Login failed!")
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
          <p className="text-slate-400 text-sm mt-2">Sign in to your account</p>
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
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Email or Phone</label>
              <input
                type="text"
                placeholder="email@example.com or 07XXXXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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

            <div className="flex justify-end">
              <button className="text-blue-400 text-xs hover:text-blue-300 transition">
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-blue-500/25"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-slate-500 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-blue-400 font-semibold hover:text-blue-300 transition"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}