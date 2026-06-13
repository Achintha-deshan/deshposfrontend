"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCustomersApi } from "../../services/customer"

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getCustomersApi()
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const totalOutstanding = customers.reduce((s, c) => s + Number(c.outstanding_balance || 0), 0)
  const creditCustomers = customers.filter(c => c.is_credit_customer).length

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
            <h1 className="text-white font-bold text-xl">Customers</h1>
          </div>
          <button onClick={() => router.push("/customers/add")}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium">
            + Add
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{customers.length}</p>
            <p className="text-slate-500 text-xs">Total</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <p className="text-blue-400 font-bold text-lg">{creditCustomers}</p>
            <p className="text-slate-500 text-xs">Credit</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
            <p className="text-orange-400 font-bold text-sm">
              Rs.{totalOutstanding.toLocaleString()}
            </p>
            <p className="text-slate-500 text-xs">Outstanding</p>
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
            <p className="text-5xl mb-3">👥</p>
            <p className="text-slate-500 text-sm mb-3">No customers yet</p>
            <button onClick={() => router.push("/customers/add")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
              + Add Customer
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((c: any) => (
              <div key={c.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{c.name}</p>
                      {c.is_credit_customer && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          💳 Credit
                        </span>
                      )}
                    </div>
                    {c.phone && <p className="text-slate-400 text-xs mt-0.5">📞 {c.phone}</p>}
                    {c.email && <p className="text-slate-500 text-xs">✉️ {c.email}</p>}
                    {c.address && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        📍 {c.address}{c.city ? `, ${c.city}` : ""}
                      </p>
                    )}
                    <div className="flex gap-3 mt-1">
                      {Number(c.total_purchases) > 0 && (
                        <span className="text-green-400 text-xs">
                          💰 Total: Rs.{Number(c.total_purchases).toLocaleString()}
                        </span>
                      )}
                      {c.credit_limit > 0 && (
                        <span className="text-blue-400 text-xs">
                          Limit: Rs.{Number(c.credit_limit).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-3 text-right flex-shrink-0">
                    {Number(c.outstanding_balance) > 0 ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                        <p className="text-red-400 text-xs">Balance</p>
                        <p className="text-red-400 font-bold text-sm">
                          Rs.{Number(c.outstanding_balance).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-2 py-1">
                        <p className="text-green-400 text-xs">✅ Clear</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                    📋 Ledger
                  </button>
                  {Number(c.outstanding_balance) > 0 && (
                    <button
                      onClick={() => router.push(`/customers/${c.id}?payment=true`)}
                      className="flex-1 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-xs">
                      💰 Pay
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}