"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"
import { getDailySalesApi } from "../../services/sale"
import { getProductsApi, getAlertsApi } from "../../services/product"

interface Business {
  id: number
  name: string
  business_type: string
  logo: string | null
}

interface Branch {
  id: number
  name: string
  location: string
  is_main: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dailySales, setDailySales] = useState<any>(null)
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expired: [], nearExpiry: [] })
  const [productCount, setProductCount] = useState(0)
  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [meRes, bizRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/business/me"),
        ])
        setUser(meRes.data.data)
        setBusiness(bizRes.data.data.business)
        setBranches(bizRes.data.data.branches)

        // Load stats
        const [daily, alts, prods, sales] = await Promise.all([
          getDailySalesApi(),
          getAlertsApi(),
          getProductsApi(),
          api.get("/sales?limit=5"),
        ])
        setDailySales(daily)
        setAlerts(alts || { lowStock: [], expired: [], nearExpiry: [] })
        setProductCount(Array.isArray(prods) ? prods.length : 0)
        setRecentSales(sales.data.data || [])
      } catch (err) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const businessIcons: Record<string, string> = {
    grocery: "🛒", clothing: "👕", phone: "📱",
    shoes: "👟", bike: "🏍️", auto: "🚗",
    hardware: "🔧", paint: "🎨", pharmacy: "💊",
    electronics: "⚡", stationery: "📚", cosmetics: "🧴",
    furniture: "🪑", agri: "🌾",
  }

  const totalAlerts = (alerts.lowStock?.length || 0) +
    (alerts.expired?.length || 0) +
    (alerts.nearExpiry?.length || 0)

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Top Nav */}
      <nav className="bg-slate-800/50 border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business?.logo ? (
              <img src={business.logo} className="w-8 h-8 rounded-lg object-cover"
                style={{ filter: "grayscale(0%)" }} alt="logo" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">
                {businessIcons[business?.business_type || ""] || "🏪"}
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-sm">{business?.name}</h1>
              <p className="text-slate-500 text-xs">{branches.find(b => b.is_main)?.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">{user?.name}</span>
            <button
              onClick={() => {
                localStorage.removeItem("ACCESS_TOKEN")
                localStorage.removeItem("REFRESH_TOKEN")
                router.push("/login")
              }}
              className="text-slate-400 hover:text-white text-xs transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Alerts Banner */}
        {totalAlerts > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {alerts.expired?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="text-red-400 text-sm font-bold">{alerts.expired.length}</span>
                <span className="text-red-400 text-xs">🚨 Expired Products</span>
              </div>
            )}
            {alerts.nearExpiry?.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="text-yellow-400 text-sm font-bold">{alerts.nearExpiry.length}</span>
                <span className="text-yellow-400 text-xs">⏰ Near Expiry (30 days)</span>
              </div>
            )}
            {alerts.lowStock?.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="text-orange-400 text-sm font-bold">{alerts.lowStock.length}</span>
                <span className="text-orange-400 text-xs">⚠️ Low Stock</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-white font-bold text-lg">
              Rs.{Number(dailySales?.total_amount || 0).toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs">Today Sales</div>
            <div className="text-slate-600 text-xs mt-1">
              {dailySales?.total_bills || 0} bills
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-white font-bold text-lg">{productCount}</div>
            <div className="text-slate-500 text-xs">Products</div>
            <button
              onClick={() => router.push("/products")}
              className="text-blue-400 text-xs mt-1 hover:text-blue-300">
              View all →
            </button>
          </div>

          <div className={`border rounded-xl p-4 ${
            alerts.expired?.length > 0
              ? "bg-red-500/10 border-red-500/30"
              : alerts.nearExpiry?.length > 0
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-slate-800/50 border-slate-700/50"
          }`}>
            <div className="text-2xl mb-2">
              {alerts.expired?.length > 0 ? "🚨" : alerts.nearExpiry?.length > 0 ? "⏰" : "✅"}
            </div>
            <div className={`font-bold text-lg ${
              alerts.expired?.length > 0 ? "text-red-400" :
              alerts.nearExpiry?.length > 0 ? "text-yellow-400" : "text-white"
            }`}>
              {alerts.expired?.length || 0}
            </div>
            <div className="text-slate-500 text-xs">Expired</div>
            {alerts.nearExpiry?.length > 0 && (
              <div className="text-yellow-400 text-xs mt-1">
                +{alerts.nearExpiry.length} near expiry
              </div>
            )}
          </div>

          <div className={`border rounded-xl p-4 ${
            alerts.lowStock?.length > 0
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-slate-800/50 border-slate-700/50"
          }`}>
            <div className="text-2xl mb-2">⚠️</div>
            <div className={`font-bold text-lg ${
              alerts.lowStock?.length > 0 ? "text-orange-400" : "text-white"
            }`}>
              {alerts.lowStock?.length || 0}
            </div>
            <div className="text-slate-500 text-xs">Low Stock</div>
            <button
              onClick={() => router.push("/products")}
              className="text-orange-400 text-xs mt-1 hover:text-orange-300">
              View →
            </button>
          </div>
        </div>

      {/* Quick Actions */}
    <div className="mb-6">
      <h2 className="text-white font-semibold text-sm mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "New Sale", icon: "🛒", route: "/pos", color: "bg-green-600 hover:bg-green-500" },
          { label: "New GRN", icon: "📥", route: "/purchase/new", color: "bg-blue-600 hover:bg-blue-500" },
          { label: "Products", icon: "📦", route: "/products", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "Add Product", icon: "➕", route: "/products/add", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "GRN History", icon: "📋", route: "/purchase", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "Sales", icon: "🧾", route: "/sales", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "Suppliers", icon: "🏢", route: "/suppliers", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "Customers", icon: "👥", route: "/customers", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "Reports", icon: "📊", route: "/reports", color: "bg-slate-700 hover:bg-slate-600" },
          { label: "AI Assistant", icon: "🤖", route: "/ai", color: "bg-blue-700 hover:bg-blue-600" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.route)}
            className={`${action.color} text-white rounded-xl p-4 text-left transition`}>
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="font-semibold text-sm">{action.label}</div>
          </button>
        ))}
      </div>
    </div>

        {/* Today Summary */}
        {dailySales && Number(dailySales.total_bills) > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-semibold text-sm mb-3">Today Summary</h2>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-slate-500 text-xs">Total Sales</p>
                  <p className="text-white font-bold text-lg">
                    Rs.{Number(dailySales.total_amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Bills</p>
                  <p className="text-white font-bold text-lg">{dailySales.total_bills || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Cash Bills</p>
                  <p className="text-green-400 font-bold text-lg">{dailySales.cash_bills || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Card Bills</p>
                  <p className="text-blue-400 font-bold text-lg">{dailySales.card_bills || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm">Recent Sales</h2>
            <button
              onClick={() => router.push("/sales")}
              className="text-blue-400 text-xs hover:text-blue-300">
              View all →
            </button>
          </div>
          {recentSales.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
              <div className="text-4xl mb-2">🧾</div>
              <p className="text-slate-400 text-sm">No sales yet</p>
              <button
                onClick={() => router.push("/pos")}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition">
                Start First Sale →
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              {recentSales.map((sale: any, i: number) => (
                <div key={sale.id}
                  className="px-4 py-3 border-b border-slate-700/50 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{sale.sale_number}</p>
                    <p className="text-slate-500 text-xs">
                      {new Date(sale.created_at).toLocaleString()} · {sale.staff_name}
                    </p>
                    {sale.customer_name && (
                      <p className="text-slate-400 text-xs">👤 {sale.customer_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm">
                      Rs.{Number(sale.total_amount).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs capitalize">{sale.payment_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branches */}
        {branches.length > 1 && (
          <div className="mb-6">
            <h2 className="text-white font-semibold text-sm mb-3">Branches</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{branch.name}</span>
                    {branch.is_main && (
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">Main</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">📍 {branch.location}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}