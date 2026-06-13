"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"

export default function PurchaseHistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [items, setItems] = useState<Record<number, any[]>>({})
  const [itemLoading, setItemLoading] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/purchase/grn")
        setOrders(Array.isArray(res.data.data) ? res.data.data : [])
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadItems = async (orderId: number) => {
    if (items[orderId]) return
    setItemLoading(orderId)
    try {
      const res = await api.get(`/purchase/grn/${orderId}`)
      setItems(prev => ({ ...prev, [orderId]: res.data.data || [] }))
    } catch {}
    finally { setItemLoading(null) }
  }

  const handleExpand = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null)
    } else {
      setExpandedId(orderId)
      await loadItems(orderId)
    }
  }

  const filtered = orders.filter(o =>
    !search ||
    o.grn_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAmount = orders.reduce((s, o) => s + Number(o.total_amount), 0)

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
            <h1 className="text-white font-bold text-xl">GRN History</h1>
          </div>
          <button onClick={() => router.push("/purchase/new")}
            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-medium">
            + New GRN
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{orders.length}</p>
            <p className="text-slate-500 text-xs">Total GRNs</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <p className="text-blue-400 font-bold text-sm">
              Rs.{totalAmount.toLocaleString()}
            </p>
            <p className="text-slate-500 text-xs">Total Purchases</p>
          </div>
        </div>

        {/* Search */}
        <input type="text"
          placeholder="🔍 Search GRN number or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none mb-4"
        />

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📥</p>
            <p className="text-slate-500 text-sm mb-3">No GRN records yet</p>
            <button onClick={() => router.push("/purchase/new")}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm">
              + New GRN
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((order: any) => (
              <div key={order.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">

                {/* Order Header */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">{order.grn_number}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(order.created_at).toLocaleString("en-LK")}
                      </p>
                      {order.supplier_name && (
                        <p className="text-blue-400 text-xs mt-0.5">
                          🏢 {order.supplier_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black text-lg">
                        Rs.{Number(order.total_amount).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${
                          order.payment_type === "cash"
                            ? "bg-green-500/20 text-green-400"
                            : order.payment_type === "credit"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {order.payment_type === "cash" ? "💵 Cash" :
                           order.payment_type === "credit" ? "💳 Credit" : "📝 Check"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment details */}
                  <div className="flex gap-3 text-xs flex-wrap">
                    <span className="text-slate-400">
                      Paid: <span className="text-white font-medium">
                        Rs.{Number(order.paid_amount).toLocaleString()}
                      </span>
                    </span>
                    {Number(order.discount) > 0 && (
                      <span className="text-slate-400">
                        Disc: <span className="text-yellow-400">
                          Rs.{Number(order.discount).toLocaleString()}
                        </span>
                      </span>
                    )}
                    {Number(order.total_amount) - Number(order.paid_amount) > 0 && (
                      <span className="text-orange-400">
                        Outstanding: Rs.{(Number(order.total_amount) - Number(order.paid_amount)).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Expand button */}
                  <button
                    onClick={() => handleExpand(order.id)}
                    className={`w-full mt-3 py-1.5 border rounded-lg text-xs transition ${
                      expandedId === order.id
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        : "bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white"
                    }`}>
                    {itemLoading === order.id ? "Loading..." :
                      expandedId === order.id ? "▲ Hide Items" : "▼ View Items"}
                  </button>
                </div>

                {/* Items Panel */}
                {expandedId === order.id && (
                  <div className="border-t border-slate-700 bg-slate-900/50 p-3">
                    <p className="text-slate-400 text-xs font-medium mb-2">📦 Items</p>
                    {!items[order.id] || items[order.id].length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-2">No items</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {items[order.id].map((item: any, i: number) => (
                          <div key={i}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                  {item.product_name}
                                </p>
                                <div className="flex gap-2 flex-wrap mt-0.5">
                                  {item.barcode && (
                                    <span className="text-slate-500 text-xs">
                                      📦 {item.barcode}
                                    </span>
                                  )}
                                  {item.batch_number && (
                                    <span className="text-yellow-500 text-xs">
                                      🏷️ {item.batch_number}
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="text-slate-500 text-xs">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-3 mt-1">
                                  <span className="text-slate-400 text-xs">
                                    Qty: {Number(item.quantity).toFixed(2)} {item.unit_type}
                                  </span>
                                  <span className="text-blue-400 text-xs">
                                    Buy: Rs.{Number(item.buy_price).toFixed(2)}
                                  </span>
                                  <span className="text-green-400 text-xs">
                                    Sell: Rs.{Number(item.sell_price).toFixed(2)}
                                  </span>
                                </div>
                                {item.expiry_date && (
                                  <p className="text-yellow-400 text-xs mt-0.5">
                                    📅 Exp: {new Date(item.expiry_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-white font-bold text-sm">
                                  Rs.{Number(item.total).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Items Total */}
                        <div className="flex justify-between items-center px-2 pt-1 border-t border-slate-700">
                          <span className="text-slate-400 text-xs">
                            {items[order.id].length} items
                          </span>
                          <span className="text-green-400 font-bold text-sm">
                            Rs.{items[order.id].reduce((s, i) => s + Number(i.total), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}