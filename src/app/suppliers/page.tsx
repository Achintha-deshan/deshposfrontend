"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSuppliersApi } from "../../services/supplier"

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getSuppliersApi()
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = suppliers.filter(s =>
    !search ||
    s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-white font-bold text-xl">Suppliers</h1>
          </div>
          <button onClick={() => router.push("/suppliers/add")}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium">
            + Add
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{suppliers.length}</p>
            <p className="text-slate-500 text-xs">Total Suppliers</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
            <p className="text-orange-400 font-bold text-lg">
              Rs.{suppliers.reduce((s, x) => s + Number(x.outstanding || 0), 0).toLocaleString()}
            </p>
            <p className="text-slate-500 text-xs">Total Outstanding</p>
          </div>
        </div>

        {/* Search */}
        <input type="text"
          placeholder="🔍 Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none mb-4"
        />

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🏢</p>
            <p className="text-slate-500 text-sm mb-3">No suppliers yet</p>
            <button onClick={() => router.push("/suppliers/add")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
              + Add Supplier
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s: any) => (
              <div key={s.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{s.company_name}</p>
                    {s.contact_person && (
                      <p className="text-slate-400 text-xs mt-0.5">👤 {s.contact_person}</p>
                    )}
                    <p className="text-slate-400 text-xs mt-0.5">📞 {s.phone}</p>
                    {s.alt_phone && <p className="text-slate-500 text-xs">📞 {s.alt_phone}</p>}
                    {s.email && <p className="text-slate-500 text-xs">✉️ {s.email}</p>}
                    {s.address && <p className="text-slate-500 text-xs mt-0.5">📍 {s.address}{s.city ? `, ${s.city}` : ""}</p>}
                    {s.credit_days > 0 && (
                      <p className="text-blue-400 text-xs mt-0.5">💳 Credit: {s.credit_days} days</p>
                    )}
                  </div>
                  <div className="ml-3 text-right flex-shrink-0">
                    {Number(s.outstanding) > 0 ? (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
                        <p className="text-orange-400 text-xs">Outstanding</p>
                        <p className="text-orange-400 font-bold text-sm">
                          Rs.{Number(s.outstanding).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                        <p className="text-green-400 text-xs">✅ Cleared</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push("/purchase/new")}
                    className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                    + New GRN
                  </button>
                  <button
                    onClick={() => router.push(`/suppliers/${s.id}`)}
                    className="flex-1 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}