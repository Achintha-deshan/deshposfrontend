"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAlertsApi } from "../../services/product"

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expired: [], nearExpiry: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"expired" | "nearExpiry" | "lowStock">("expired")

  useEffect(() => {
    getAlertsApi()
      .then(data => setAlerts(data || { lowStock: [], expired: [], nearExpiry: [] }))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse text-sm">Loading...</div>
    </div>
  )

  const tabs = [
    {
      key: "expired" as const,
      label: "Expired",
      icon: "🚨",
      count: alerts.expired?.length || 0,
      color: "red",
    },
    {
      key: "nearExpiry" as const,
      label: "Near Expiry",
      icon: "⏰",
      count: alerts.nearExpiry?.length || 0,
      color: "yellow",
    },
    {
      key: "lowStock" as const,
      label: "Low Stock",
      icon: "⚠️",
      count: alerts.lowStock?.length || 0,
      color: "orange",
    },
  ]

  const tabColors: Record<string, string> = {
    red: "bg-red-600 text-white",
    yellow: "bg-yellow-600 text-white",
    orange: "bg-orange-600 text-white",
  }

  const tabInactiveColors: Record<string, string> = {
    red: "bg-red-500/10 text-red-400 border border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    orange: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">🔔 Alerts</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-red-400 font-black text-2xl">{alerts.expired?.length || 0}</p>
            <p className="text-red-400 text-xs">🚨 Expired</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-black text-2xl">{alerts.nearExpiry?.length || 0}</p>
            <p className="text-yellow-400 text-xs">⏰ Near Expiry</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
            <p className="text-orange-400 font-black text-2xl">{alerts.lowStock?.length || 0}</p>
            <p className="text-orange-400 text-xs">⚠️ Low Stock</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === tab.key
                  ? tabColors[tab.color]
                  : tabInactiveColors[tab.color]
              }`}>
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? "bg-white/20" : "bg-current/20"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Expired */}
        {activeTab === "expired" && (
          <div className="flex flex-col gap-2">
            {alerts.expired?.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-slate-500 text-sm">No expired products!</p>
              </div>
            ) : (
              alerts.expired.map((item: any, i: number) => (
                <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{item.product_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.batch_number}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-red-400 text-xs">
                          🚨 Expired: {new Date(item.expiry_date).toLocaleDateString("en-LK")}
                        </span>
                        <span className="text-slate-400 text-xs">
                          Qty: {Number(item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-blue-400 text-xs">
                          Buy: Rs.{Number(item.buy_price).toFixed(2)}
                        </span>
                        {item.sell_price && (
                          <span className="text-green-400 text-xs">
                            Sell: Rs.{Number(item.sell_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 text-center">
                        <p className="text-red-400 text-xs font-bold">
                          {Math.abs(Math.floor((new Date().getTime() - new Date(item.expiry_date).getTime()) / (1000 * 60 * 60 * 24)))} days
                        </p>
                        <p className="text-red-400/70 text-xs">ago</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/products/add?barcode=${item.barcode || ""}`)}
                    className="w-full mt-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20">
                    🗑️ Manage Batch
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Near Expiry */}
        {activeTab === "nearExpiry" && (
          <div className="flex flex-col gap-2">
            {alerts.nearExpiry?.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-slate-500 text-sm">No near expiry products!</p>
              </div>
            ) : (
              alerts.nearExpiry.map((item: any, i: number) => {
                const daysLeft = Math.floor(
                  (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div key={i} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{item.product_name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{item.batch_number}</p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          <span className="text-yellow-400 text-xs">
                            ⏰ Exp: {new Date(item.expiry_date).toLocaleDateString("en-LK")}
                          </span>
                          <span className="text-slate-400 text-xs">
                            Qty: {Number(item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-blue-400 text-xs">
                            Buy: Rs.{Number(item.buy_price).toFixed(2)}
                          </span>
                          {item.sell_price && (
                            <span className="text-green-400 text-xs">
                              Sell: Rs.{Number(item.sell_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <div className={`border rounded-lg px-2 py-1 text-center ${
                          daysLeft <= 7
                            ? "bg-red-500/20 border-red-500/30"
                            : "bg-yellow-500/20 border-yellow-500/30"
                        }`}>
                          <p className={`text-sm font-black ${
                            daysLeft <= 7 ? "text-red-400" : "text-yellow-400"
                          }`}>{daysLeft}</p>
                          <p className={`text-xs ${
                            daysLeft <= 7 ? "text-red-400/70" : "text-yellow-400/70"
                          }`}>days</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/products/add?barcode=${item.barcode || ""}`)}
                      className="w-full mt-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/20">
                      ✏️ Manage Batch
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Low Stock */}
        {activeTab === "lowStock" && (
          <div className="flex flex-col gap-2">
            {alerts.lowStock?.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-slate-500 text-sm">All products well stocked!</p>
              </div>
            ) : (
              alerts.lowStock.map((product: any, i: number) => {
                const isOut = Number(product.stock) <= 0
                return (
                  <div key={i} className={`border rounded-xl p-4 ${
                    isOut
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-orange-500/5 border-orange-500/20"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{product.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {product.product_code}
                          {product.barcode ? ` · ${product.barcode}` : ""}
                          {product.category ? ` · ${product.category}` : ""}
                        </p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          <span className={`text-xs font-bold ${isOut ? "text-red-400" : "text-orange-400"}`}>
                            {isOut ? "❌ Out of Stock" : "⚠️"} Stock: {Number(product.stock).toFixed(2)} {product.unit_type}
                          </span>
                          <span className="text-slate-500 text-xs">
                            Alert: {product.low_stock_alert} {product.unit_type}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-blue-400 text-xs">
                            Buy: Rs.{Number(product.buy_price).toFixed(2)}
                          </span>
                          <span className="text-green-400 text-xs">
                            Sell: Rs.{Number(product.sell_price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Stock bar */}
                      <div className="ml-3 flex-shrink-0 text-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          isOut
                            ? "bg-red-500/20 border-red-500/30"
                            : "bg-orange-500/20 border-orange-500/30"
                        }`}>
                          <p className={`text-sm font-black ${isOut ? "text-red-400" : "text-orange-400"}`}>
                            {Number(product.stock).toFixed(0)}
                          </p>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{product.unit_type}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => router.push(`/products/add?barcode=${product.barcode || ""}`)}
                        className="flex-1 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-xs hover:bg-green-600/30">
                        ➕ Add Stock
                      </button>
                      <button
                        onClick={() => router.push("/purchase/new")}
                        className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:bg-blue-600/30">
                        📥 New GRN
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  )
}