"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { getCustomerLedgerApi, recordCustomerPaymentApi } from "../../../services/customer"
import { getSaleByNumberApi } from "../../../services/sale"
import Receipt from "../../../components/Receipt"
import api from "../../../services/api"
import {
  printReceipt, openCashDrawer,
  isBTConnected, isUSBConnected
} from "../../../utils/printer"

export default function CustomerLedgerPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = Number(params.id)

  const [customer, setCustomer] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [payDesc, setPayDesc] = useState("")
  const [payLoading, setPayLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptSale, setReceiptSale] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)

  useEffect(() => {
    loadData()
    if (searchParams.get("payment") === "true") setShowPayment(true)
    api.get("/business/me").then(res => setBusiness(res.data.data.business)).catch(() => {})
  }, [id])

  const loadData = async () => {
    try {
      const data = await getCustomerLedgerApi(id)
      setCustomer(data.customer)
      setLedger(data.ledger)
    } catch {
      router.push("/customers")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return setError("Enter valid amount!")
    try {
      setPayLoading(true)
      setError("")
      await recordCustomerPaymentApi(id, Number(payAmount), payDesc || undefined)
      setSuccess("Payment recorded! ✅")
      setShowPayment(false)
      setPayAmount("")
      setPayDesc("")
      await loadData()
      setTimeout(() => setSuccess(""), 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed!")
    } finally {
      setPayLoading(false)
    }
  }

  const handlePrintBill = async (saleNumber: string) => {
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
    } catch {
      setError("Bill not found!")
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/customers")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">Customer Ledger</h1>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Customer Info Card */}
        {customer && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-lg">{customer.name}</p>
                  {customer.is_credit_customer && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-lg">
                      💳 Credit
                    </span>
                  )}
                </div>
                {customer.phone && <p className="text-slate-400 text-sm mt-1">📞 {customer.phone}</p>}
                {customer.email && <p className="text-slate-500 text-xs">{customer.email}</p>}
                {customer.address && (
                  <p className="text-slate-500 text-xs">
                    📍 {customer.address}{customer.city ? `, ${customer.city}` : ""}
                  </p>
                )}
              </div>
              <div className="text-right">
                {Number(customer.outstanding_balance) > 0 ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    <p className="text-red-400 text-xs">Balance Due</p>
                    <p className="text-red-400 font-black text-xl">
                      Rs.{Number(customer.outstanding_balance).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                    <p className="text-green-400 text-sm font-bold">✅ Cleared</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-900/50 rounded-xl p-2 text-center">
                <p className="text-green-400 font-bold text-sm">
                  Rs.{Number(customer.total_purchases).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs">Total Purchases</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-2 text-center">
                <p className="text-blue-400 font-bold text-sm">
                  Rs.{Number(customer.total_paid).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs">Total Paid</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-2 text-center">
                <p className="text-slate-400 font-bold text-sm">
                  Rs.{Number(customer.credit_limit).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs">Credit Limit</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              {Number(customer.outstanding_balance) > 0 && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold">
                  💰 Record Payment
                </button>
              )}
              <button
                onClick={() => router.push("/pos")}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
                🛒 New Sale
              </button>
            </div>
          </div>
        )}

        {/* Ledger */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">📋 Transaction History</h2>
          <span className="text-slate-500 text-xs">{ledger.length} records</span>
        </div>

        {ledger.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-slate-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ledger.map((entry: any) => (
              <div key={entry.id}
                className={`rounded-xl border p-3 ${
                  entry.type === "payment"
                    ? "bg-green-500/5 border-green-500/20"
                    : entry.type === "credit"
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-slate-800/50 border-slate-700"
                }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {entry.type === "payment" ? "💰" :
                         entry.type === "credit" ? "📝" : "🧾"}
                      </span>
                      <p className={`text-sm font-medium ${
                        entry.type === "payment" ? "text-green-400" :
                        entry.type === "credit" ? "text-red-400" : "text-white"
                      }`}>
                        {entry.type === "payment" ? "Payment Received" :
                         entry.type === "credit" ? "Credit Sale" : "Sale"}
                      </p>
                    </div>
                    {entry.sale_number && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        Bill: {entry.sale_number}
                      </p>
                    )}
                    {entry.description && (
                      <p className="text-slate-400 text-xs mt-0.5">{entry.description}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(entry.created_at).toLocaleString("en-LK")}
                    </p>
                  </div>

                  <div className="text-right ml-2 flex-shrink-0">
                    <p className={`font-bold text-sm ${
                      entry.type === "payment" ? "text-green-400" : "text-white"
                    }`}>
                      {entry.type === "payment" ? "+" : ""}Rs.{Number(entry.amount).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs">
                      Balance: Rs.{Number(entry.balance).toLocaleString()}
                    </p>
                    {/* ✅ Print Bill button */}
                    {entry.sale_number && (
                      <button
                        onClick={() => handlePrintBill(entry.sale_number)}
                        className="mt-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg hover:bg-blue-500/20 transition">
                        🖨️ Print
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">💰 Record Payment</h3>
              <button onClick={() => { setShowPayment(false); setError("") }}
                className="text-slate-500 hover:text-white text-xl">×</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}

            {customer && Number(customer.outstanding_balance) > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-4 text-center">
                <p className="text-red-400 text-xs">Outstanding Balance</p>
                <p className="text-red-400 font-black text-2xl">
                  Rs.{Number(customer.outstanding_balance).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Amount (Rs.) *</label>
                <input type="number"
                  placeholder="Enter amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-green-500/30 rounded-xl text-white text-lg font-bold focus:outline-none"
                  autoFocus
                />
              </div>

              {customer && Number(customer.outstanding_balance) > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button key={amt}
                      onClick={() => setPayAmount(amt.toString())}
                      className="flex-1 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs">
                      {amt >= 1000 ? `${amt/1000}k` : amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setPayAmount(Number(customer.outstanding_balance).toFixed(2))}
                    className="flex-1 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-xs border border-green-500/30">
                    Full Rs.{Number(customer.outstanding_balance).toLocaleString()}
                  </button>
                </div>
              )}

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Description (optional)</label>
                <input type="text"
                  placeholder="Eg: Cash payment"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setShowPayment(false); setError("") }}
                  className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-xl text-sm">
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={payLoading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm disabled:opacity-40">
                  {payLoading ? "Saving..." : "Record ✅"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Receipt Modal */}
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
                  } else {
                    window.print()
                  }
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