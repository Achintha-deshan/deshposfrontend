"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"
import Receipt from "../../components/Receipt"
import { getSaleByNumberApi } from "../../services/sale"
import {
  printReceipt, openCashDrawer,
  isBTConnected, isUSBConnected
} from "../../utils/printer"

export default function SalesHistoryPage() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterPayment, setFilterPayment] = useState("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptSale, setReceiptSale] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [items, setItems] = useState<Record<number, any[]>>({})
  const [dailyStats, setDailyStats] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [salesRes, bizRes] = await Promise.all([
          api.get("/sales?limit=100"),
          api.get("/business/me"),
        ])
        setSales(salesRes.data.data || [])
        setBusiness(bizRes.data.data.business)

        // Daily stats
        const today = new Date().toISOString().split("T")[0]
        const statsRes = await api.get(`/sales/daily?date=${today}`)
        setDailyStats(statsRes.data.data)
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadItems = async (saleId: number) => {
    if (items[saleId]) return
    try {
        const res = await api.get(`/sales/${saleId}`)
        setItems(prev => ({ ...prev, [saleId]: res.data.data?.items || [] }))
    } catch {}
  }

  const handleExpand = async (saleId: number) => {
    if (expandedId === saleId) {
      setExpandedId(null)
    } else {
      setExpandedId(saleId)
      await loadItems(saleId)
    }
  }

  const handlePrint = async (saleNumber: string) => {
    try {
      const data = await getSaleByNumberApi(saleNumber)
      const saleData = {
        ...data.sale,
        items: data.items,
        total: Number(data.sale.total_amount),
        change: Number(data.sale.change_amount),
        cart_discount: Number(data.sale.discount),
      }
      setReceiptSale(saleData)
      setShowReceipt(true)
    } catch { alert("Bill not found!") }
  }

  const filtered = sales.filter(s => {
    const matchSearch = !search ||
      s.sale_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(search.toLowerCase())
    const matchDate = !filterDate ||
      new Date(s.created_at).toISOString().split("T")[0] === filterDate
    const matchPayment = !filterPayment || s.payment_type === filterPayment
    return matchSearch && matchDate && matchPayment
  })

  const totalAmount = filtered.reduce((s, x) => s + Number(x.total_amount), 0)

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
            <h1 className="text-white font-bold text-xl">Sales History</h1>
          </div>
          <button onClick={() => router.push("/pos")}
            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-medium">
            + New Sale
          </button>
        </div>

        {/* Today Stats */}
        {dailyStats && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
            <p className="text-slate-400 text-xs mb-3">📅 Today's Summary</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-green-400 font-black text-lg">
                  Rs.{Number(dailyStats.total_amount || 0).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{dailyStats.total_bills || 0}</p>
                <p className="text-slate-500 text-xs">Bills</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-bold text-lg">
                  {Number(dailyStats.total_bills) > 0
                    ? `Rs.${(Number(dailyStats.total_amount) / Number(dailyStats.total_bills)).toFixed(0)}`
                    : "Rs.0"
                  }
                </p>
                <p className="text-slate-500 text-xs">Avg Bill</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-slate-400 text-xs">Cash: {dailyStats.cash_bills || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-slate-400 text-xs">Card: {dailyStats.card_bills || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{filtered.length}</p>
            <p className="text-slate-500 text-xs">
              {search || filterDate || filterPayment ? "Filtered" : "Total"} Sales
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-green-400 font-bold text-sm">
              Rs.{totalAmount.toLocaleString()}
            </p>
            <p className="text-slate-500 text-xs">Total Amount</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-4">
          <input type="text"
            placeholder="🔍 Search bill number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          <div className="flex gap-2">
            <input type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
            />
            <select value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
              <option value="">All Types</option>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="credit">📝 Credit</option>
              <option value="check">📄 Check</option>
            </select>
            {(search || filterDate || filterPayment) && (
              <button
                onClick={() => { setSearch(""); setFilterDate(""); setFilterPayment("") }}
                className="px-3 py-2 bg-slate-700 text-slate-400 rounded-xl text-xs">
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Sales List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🧾</p>
            <p className="text-slate-500 text-sm mb-3">No sales found</p>
            <button onClick={() => router.push("/pos")}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm">
              + New Sale
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((sale: any) => (
              <div key={sale.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">

                {/* Sale Header */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">{sale.sale_number}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(sale.created_at).toLocaleString("en-LK")}
                      </p>
                      {sale.customer_name && (
                        <p className="text-blue-400 text-xs mt-0.5">👤 {sale.customer_name}</p>
                      )}
                      {sale.staff_name && sale.staff_name !== "Owner" && (
                        <p className="text-slate-500 text-xs">👷 {sale.staff_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black text-lg">
                        Rs.{Number(sale.total_amount).toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${
                        sale.payment_type === "cash"
                          ? "bg-green-500/20 text-green-400"
                          : sale.payment_type === "card"
                            ? "bg-blue-500/20 text-blue-400"
                            : sale.payment_type === "credit"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-purple-500/20 text-purple-400"
                      }`}>
                        {sale.payment_type === "cash" ? "💵 Cash" :
                         sale.payment_type === "card" ? "💳 Card" :
                         sale.payment_type === "credit" ? "📝 Credit" : "📄 Check"}
                      </span>
                    </div>
                  </div>

                  {/* Payment details */}
                  <div className="flex gap-3 text-xs flex-wrap mb-3">
                    <span className="text-slate-400">
                      Paid: <span className="text-white">Rs.{Number(sale.paid_amount).toLocaleString()}</span>
                    </span>
                    {Number(sale.discount) > 0 && (
                      <span className="text-slate-400">
                        Disc: <span className="text-yellow-400">Rs.{Number(sale.discount).toLocaleString()}</span>
                      </span>
                    )}
                    {Number(sale.change_amount) > 0 && (
                      <span className="text-slate-400">
                        Change: <span className="text-slate-300">Rs.{Number(sale.change_amount).toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExpand(sale.id)}
                      className={`flex-1 py-1.5 border rounded-lg text-xs transition ${
                        expandedId === sale.id
                          ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                          : "bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white"
                      }`}>
                      {expandedId === sale.id ? "▲ Hide Items" : "▼ View Items"}
                    </button>
                    <button
                      onClick={() => handlePrint(sale.sale_number)}
                      className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:bg-blue-600/30">
                      🖨️ Print
                    </button>
                  </div>
                </div>

                {/* Items Panel */}
                {expandedId === sale.id && (
                  <div className="border-t border-slate-700 bg-slate-900/50 p-3">
                    <p className="text-slate-400 text-xs font-medium mb-2">📦 Items</p>
                    {!items[sale.id] ? (
                      <p className="text-slate-500 text-xs text-center py-2 animate-pulse">Loading...</p>
                    ) : items[sale.id].length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-2">No items</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {items[sale.id].map((item: any, i: number) => (
                          <div key={i}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{item.product_name}</p>
                                <div className="flex gap-2 flex-wrap mt-0.5">
                                  {item.batch_number && (
                                    <span className="text-yellow-500 text-xs">🏷️ {item.batch_number}</span>
                                  )}
                                  {item.barcode && (
                                    <span className="text-slate-500 text-xs">{item.barcode}</span>
                                  )}
                                </div>
                                <div className="flex gap-3 mt-1">
                                  <span className="text-slate-400 text-xs">
                                    {Number(item.quantity).toFixed(2)} {item.unit_type}
                                  </span>
                                  <span className="text-blue-400 text-xs">
                                    Rs.{Number(item.unit_price).toFixed(2)}
                                  </span>
                                  {Number(item.discount) > 0 && (
                                    <span className="text-red-400 text-xs">
                                      -Rs.{Number(item.discount).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-white font-bold text-sm ml-2">
                                Rs.{Number(item.total).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Items total */}
                        <div className="flex justify-between items-center px-2 pt-1 border-t border-slate-700">
                          <span className="text-slate-400 text-xs">
                            {items[sale.id].length} items
                          </span>
                          <span className="text-green-400 font-bold text-sm">
                            Rs.{Number(sale.total_amount).toLocaleString()}
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

      {/* Receipt Modal */}
      {showReceipt && receiptSale && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <Receipt
              sale={receiptSale}
              items={receiptSale.items || []}
              business={business}
              language="en"
            />
            <div className="flex gap-2 p-3 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={async () => {
                  if (isBTConnected() || isUSBConnected()) {
                    await printReceipt(receiptSale, receiptSale.items || [], business, "en", receiptSale.change || 0)
                    await openCashDrawer()
                  } else { window.print() }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm">
                🖨️ Print
              </button>
              <button
                onClick={() => { setShowReceipt(false); setReceiptSale(null) }}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-semibold text-sm">
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}