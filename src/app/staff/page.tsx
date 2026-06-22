"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"

export default function StaffPage() {
  const router = useRouter()
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    role: "CASHIER",
  })

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      const res = await api.get("/auth/staff/list")
      setStaffList(res.data.data || [])
    } catch {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async () => {
    if (!form.name || !form.username || !form.password) {
      return setError("Name, Username, Password required!")
    }
    try {
      setSaving(true)
      setError("")
      await api.post("/auth/staff/add", form)
      setSuccess("Staff added successfully! ✅")
      setShowAdd(false)
      setForm({ name: "", username: "", email: "", phone_number: "", password: "", role: "CASHIER" })
      await loadStaff()
      setTimeout(() => setSuccess(""), 2500)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed!")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-white font-bold text-xl">👥 Staff Management</h1>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium">
            + Add Staff
          </button>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        {staffList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-slate-500 text-sm mb-3">No staff added yet</p>
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
              + Add First Staff
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {staffList.map((staff: any) => (
              <div key={staff.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{staff.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${
                        staff.role === "MANAGER"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {staff.role === "MANAGER" ? "👔 Manager" : "🛒 Cashier"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">@{staff.username}</p>
                    {staff.phone_number && (
                      <p className="text-slate-500 text-xs">📞 {staff.phone_number}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    staff.approved
                      ? "bg-green-500/10 text-green-400"
                      : "bg-orange-500/10 text-orange-400"
                  }`}>
                    {staff.approved ? "✅ Active" : "⏳ Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">➕ Add Staff Member</h3>
              <button onClick={() => { setShowAdd(false); setError("") }}
                className="text-slate-500 hover:text-white text-xl">×</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Full Name *</label>
                <input type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Eg: Nimal Perera"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Username * (for login)</label>
                <input type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                  placeholder="Eg: nimal01"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-blue-500/30 rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Password *</label>
                <input type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Phone Number</label>
                <input type="tel"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="07XXXXXXXX"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Email (optional)</label>
                <input type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@email.com"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Role *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, role: "CASHIER" })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      form.role === "CASHIER"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 border border-slate-600 text-slate-400"
                    }`}>
                    🛒 Cashier
                  </button>
                  <button
                    onClick={() => setForm({ ...form, role: "MANAGER" })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      form.role === "MANAGER"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 border border-slate-600 text-slate-400"
                    }`}>
                    👔 Manager
                  </button>
                </div>
              </div>

              <button onClick={handleAddStaff} disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm mt-2 disabled:opacity-40">
                {saving ? "Adding..." : "✅ Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}