"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "../../../../services/api"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    category: "",
    buy_price: "",
    sell_price: "",
    print_price: "",
    min_stock: "",
    low_stock_alert: "",
    notes: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/products/${id}`)
        const p = res.data.data
        setForm({
          name: p.name || "",
          category: p.category || "",
          buy_price: p.buy_price?.toString() || "",
          sell_price: p.sell_price?.toString() || "",
          print_price: p.print_price?.toString() || "",
          min_stock: p.min_stock?.toString() || "",
          low_stock_alert: p.low_stock_alert?.toString() || "",
          notes: p.notes || "",
        })
      } catch {
        router.push("/products")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async () => {
    if (!form.name || !form.sell_price) {
      return setError("Name and Sell Price required!")
    }
    try {
      setSaving(true)
      setError("")
      await api.put(`/products/${id}`, {
        name: form.name,
        category: form.category || undefined,
        buy_price: Number(form.buy_price) || 0,
        sell_price: Number(form.sell_price),
        print_price: Number(form.print_price) || 0,
        min_stock: Number(form.min_stock) || 0,
        low_stock_alert: Number(form.low_stock_alert) || 5,
        notes: form.notes || undefined,
      })
      setSuccess("Product updated! ✅")
      setTimeout(() => router.push("/products"), 1500)
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
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/products")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">✏️ Edit Product</h1>
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

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Product Name *</label>
            <input type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Category</label>
            <input type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Eg: Food"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
            />
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white text-sm font-medium mb-3">💰 Pricing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 text-xs">Buy Price (Rs.)</label>
                <input type="number"
                  value={form.buy_price}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Sell Price (Rs.) *</label>
                <input type="number"
                  value={form.sell_price}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Print/MRP Price (Rs.)</label>
                <input type="number"
                  value={form.print_price}
                  onChange={(e) => setForm({ ...form, print_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              {form.buy_price && form.sell_price && Number(form.buy_price) > 0 && (
                <div className="flex items-end pb-1">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 w-full">
                    <p className="text-green-400 text-xs font-medium">
                      Profit: Rs.{(Number(form.sell_price) - Number(form.buy_price)).toFixed(2)}
                    </p>
                    <p className="text-green-400/70 text-xs">
                      ({(((Number(form.sell_price) - Number(form.buy_price)) / Number(form.buy_price)) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white text-sm font-medium mb-3">📦 Stock Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 text-xs">Min Stock</label>
                <input type="number"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Alert Level</label>
                <input type="number"
                  value={form.low_stock_alert}
                  onChange={(e) => setForm({ ...form, low_stock_alert: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-orange-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none resize-none"
            />
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-40">
            {saving ? "Saving..." : "Save Changes ✅"}
          </button>

        </div>
      </div>
    </div>
  )
}