"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [dailyData, setDailyData] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any>(null)
  const [monthlySales, setMonthlySales] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily")

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedMonth])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dailyRes, monthlyRes, salesRes] = await Promise.all([
        api.get(`/sales/daily?date=${selectedDate}`),
        api.get(`/sales/monthly?month=${selectedMonth}`),
        api.get(`/sales?limit=500`),
      ])
      setDailyData(dailyRes.data.data)
      setMonthlyData(monthlyRes.data.data)

      const allSales = salesRes.data.data || []
      const monthly = allSales.filter((s: any) =>
        new Date(s.created_at).toISOString().slice(0, 7) === selectedMonth
      )
      setMonthlySales(monthly)
    } catch {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const getDailyBreakdown = () => {
    const grouped: Record<string, { total: number, bills: number }> = {}
    monthlySales.forEach(s => {
      const date = new Date(s.created_at).toISOString().split("T")[0]
      if (!grouped[date]) grouped[date] = { total: 0, bills: 0 }
      grouped[date].total += Number(s.total_amount)
      grouped[date].bills += 1
    })
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))
  }

  const dailyBreakdown = getDailyBreakdown()
  const maxDailyTotal = Math.max(...dailyBreakdown.map(([, d]) => d.total), 1)

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">📊 Reports</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("daily")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "daily" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
            📅 Daily
          </button>
          <button onClick={() => setActiveTab("monthly")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "monthly" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
            📆 Monthly
          </button>
        </div>

        {/* Daily Report */}
        {activeTab === "daily" && (
          <div className="flex flex-col gap-4">

            <div>
              <label className="text-slate-400 text-xs mb-1 block">Select Date</label>
              <input type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            {dailyData && (
              <>
                {/* Top Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-green-400 font-black text-2xl">
                      Rs.{Number(dailyData.total_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Total Sales</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                    <p className="text-blue-400 font-black text-2xl">
                      {dailyData.total_bills || 0}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Total Bills</p>
                  </div>
                </div>

                {/* Profit Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                    <p className="text-yellow-400 font-black text-xl">
                      Rs.{Number(dailyData.gross_profit || 0).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">💰 Gross Profit</p>
                    <p className="text-slate-600 text-xs">(Sell - Buy)</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                    <p className="text-purple-400 font-black text-xl">
                      Rs.{Number(dailyData.net_profit || 0).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">✅ Net Profit</p>
                    <p className="text-slate-600 text-xs">(After discount)</p>
                  </div>
                </div>

                {/* Daily Summary */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-white text-sm font-medium mb-3">📊 Daily Summary</h3>
                  <div className="flex flex-col gap-0">
                    {[
                      { label: "Gross Sales", value: `Rs.${Number(dailyData.total_amount || 0).toLocaleString()}`, color: "text-green-400" },
                      { label: "Total Discount", value: `-Rs.${Number(dailyData.total_discount || 0).toLocaleString()}`, color: "text-red-400" },
                      { label: "Net Revenue", value: `Rs.${(Number(dailyData.total_amount || 0) - Number(dailyData.total_discount || 0)).toLocaleString()}`, color: "text-blue-400" },
                      { label: "💰 Gross Profit", value: `Rs.${Number(dailyData.gross_profit || 0).toLocaleString()}`, color: "text-yellow-400" },
                      { label: "✅ Net Profit", value: `Rs.${Number(dailyData.net_profit || 0).toLocaleString()}`, color: "text-purple-400" },
                    //   { label: "Total Paid", value: `Rs.${Number(dailyData.total_paid || 0).toLocaleString()}`, color: "text-white" },
                      { label: "Cash Bills", value: dailyData.cash_bills || 0, color: "text-green-400" },
                      { label: "Card Bills", value: dailyData.card_bills || 0, color: "text-blue-400" },
                      { label: "Credit Bills", value: dailyData.credit_bills || 0, color: "text-orange-400" },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                        <span className="text-slate-400 text-sm">{row.label}</span>
                        <span className={`font-bold text-sm ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {Number(dailyData.total_bills) === 0 && (
                  <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-slate-500 text-sm">No sales on this date</p>
                  </div>
                )}

                {Number(dailyData.total_bills) > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-white text-sm font-medium mb-3">📈 Performance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                        <p className="text-yellow-400 font-bold text-lg">
                          Rs.{Number(dailyData.total_bills) > 0
                            ? (Number(dailyData.total_amount) / Number(dailyData.total_bills)).toFixed(0)
                            : 0}
                        </p>
                        <p className="text-slate-500 text-xs">Avg Bill Value</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                        <p className="text-purple-400 font-bold text-lg">
                          {Number(dailyData.total_bills) > 0 && Number(dailyData.total_amount) > 0
                            ? ((Number(dailyData.gross_profit) / Number(dailyData.total_amount)) * 100).toFixed(1)
                            : 0}%
                        </p>
                        <p className="text-slate-500 text-xs">Profit Margin</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Monthly Report */}
        {activeTab === "monthly" && (
          <div className="flex flex-col gap-4">

            <div>
              <label className="text-slate-400 text-xs mb-1 block">Select Month</label>
              <input type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <p className="text-green-400 font-black text-xl">
                  Rs.{Number(monthlyData?.total_amount || 0).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-1">Total Sales</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                <p className="text-blue-400 font-black text-xl">
                  {monthlyData?.total_bills || 0}
                </p>
                <p className="text-slate-500 text-xs mt-1">Total Bills</p>
              </div>
            </div>

            {/* Profit Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <p className="text-yellow-400 font-black text-xl">
                  Rs.{Number(monthlyData?.gross_profit || 0).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-1">💰 Gross Profit</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                <p className="text-purple-400 font-black text-xl">
                  Rs.{Number(monthlyData?.net_profit || 0).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-1">✅ Net Profit</p>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-3">📊 Monthly Summary</h3>
              <div className="flex flex-col gap-0">
                {[
                  { label: "Gross Sales", value: `Rs.${Number(monthlyData?.total_amount || 0).toLocaleString()}`, color: "text-green-400" },
                  { label: "Total Discount", value: `-Rs.${Number(monthlyData?.total_discount || 0).toLocaleString()}`, color: "text-red-400" },
                  { label: "Net Revenue", value: `Rs.${(Number(monthlyData?.total_amount || 0) - Number(monthlyData?.total_discount || 0)).toLocaleString()}`, color: "text-blue-400" },
                  { label: "💰 Gross Profit", value: `Rs.${Number(monthlyData?.gross_profit || 0).toLocaleString()}`, color: "text-yellow-400" },
                  { label: "✅ Net Profit", value: `Rs.${Number(monthlyData?.net_profit || 0).toLocaleString()}`, color: "text-purple-400" },
                  { label: "Avg Bill Value", value: `Rs.${Number(monthlyData?.total_bills) > 0 ? (Number(monthlyData?.total_amount) / Number(monthlyData?.total_bills)).toFixed(0) : 0}`, color: "text-yellow-400" },
                  { label: "Profit Margin", value: `${Number(monthlyData?.total_amount) > 0 ? ((Number(monthlyData?.gross_profit) / Number(monthlyData?.total_amount)) * 100).toFixed(1) : 0}%`, color: "text-purple-400" },
                  { label: "Cash Bills", value: monthlyData?.cash_bills || 0, color: "text-green-400" },
                  { label: "Card Bills", value: monthlyData?.card_bills || 0, color: "text-blue-400" },
                  { label: "Credit Bills", value: monthlyData?.credit_bills || 0, color: "text-orange-400" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                    <span className="text-slate-400 text-sm">{row.label}</span>
                    <span className={`font-bold text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-3">💳 Payment Breakdown</h3>
              <div className="flex gap-2">
                {[
                  { label: "Cash", count: Number(monthlyData?.cash_bills || 0), color: "bg-green-500" },
                  { label: "Card", count: Number(monthlyData?.card_bills || 0), color: "bg-blue-500" },
                  { label: "Credit", count: Number(monthlyData?.credit_bills || 0), color: "bg-orange-500" },
                ].map((p, i) => {
                  const total = Number(monthlyData?.total_bills || 0)
                  const pct = total > 0 ? (p.count / total * 100).toFixed(0) : 0
                  return (
                    <div key={i} className="flex-1 text-center">
                      <div className="bg-slate-900/50 rounded-xl p-2">
                        <p className="text-white font-bold text-lg">{p.count}</p>
                        <p className="text-slate-500 text-xs">{p.label}</p>
                        <p className="text-slate-400 text-xs">{pct}%</p>
                      </div>
                      <div className="mt-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className={`${p.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Daily Chart */}
            {dailyBreakdown.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-white text-sm font-medium mb-4">📈 Daily Sales Chart</h3>
                <div className="flex items-end gap-1 h-32">
                  {dailyBreakdown.map(([date, data]) => {
                    const height = Math.max((data.total / maxDailyTotal) * 100, 4)
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-400 transition cursor-pointer"
                          style={{ height: `${height}%` }}
                          title={`${date}: Rs.${data.total.toLocaleString()} (${data.bills} bills)`}
                        />
                        <p className="text-slate-600" style={{ fontSize: "8px" }}>
                          {new Date(date).getDate()}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-slate-500 text-xs">
                    Best: Rs.{Math.max(...dailyBreakdown.map(([, d]) => d.total)).toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs">Days: {dailyBreakdown.length}</p>
                </div>
              </div>
            )}

            {monthlySales.length === 0 && (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-slate-500 text-sm">No sales this month</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}