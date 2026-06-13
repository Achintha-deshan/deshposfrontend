"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addCustomerApi } from "../../../services/customer"

export default function AddCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    credit_limit: "",
    is_credit_customer: false,
    notes: "",
  })

  const handleSubmit = async () => {
    if (!form.name) return setError("Name required!")
    try {
      setLoading(true)
      setError("")
      await addCustomerApi({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        credit_limit: Number(form.credit_limit) || 0,
        is_credit_customer: form.is_credit_customer,
        notes: form.notes || undefined,
      })
      setSuccess("Customer added! ✅")
      setTimeout(() => router.push("/customers"), 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/customers")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">Add Customer</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Basic Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-white text-sm font-medium">👤 Customer Info</h3>

            <div>
              <label className="text-slate-400 text-xs mb-1 block">Full Name *</label>
              <input type="text" placeholder="Eg: Kamal Perera"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Phone</label>
                <input type="tel" placeholder="07X XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Email</label>
                <input type="email" placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Address</label>
                <textarea placeholder="Street address..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">City</label>
                <input type="text" placeholder="Colombo"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Credit Settings */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-white text-sm font-medium">💳 Credit Settings</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white text-sm">Credit Customer</p>
                <p className="text-slate-500 text-xs">Naya ගෙවීම allow කරන්නද?</p>
              </div>
              <div
                onClick={() => setForm({ ...form, is_credit_customer: !form.is_credit_customer })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  form.is_credit_customer ? "bg-blue-600" : "bg-slate-600"
                }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.is_credit_customer ? "translate-x-7" : "translate-x-1"
                }`} />
              </div>
            </label>

            {form.is_credit_customer && (
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Credit Limit (Rs.)</label>
                <input type="number" placeholder="0"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                />
                <p className="text-slate-500 text-xs mt-1">
                  0 = unlimited credit
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Notes (optional)</label>
            <textarea placeholder="Any notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none resize-none"
            />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-40">
            {loading ? "Saving..." : "Add Customer ✅"}
          </button>
        </div>
      </div>
    </div>
  )
}