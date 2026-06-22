"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"

export default function PaymentPage() {
  const router = useRouter()
  const [license, setLicense] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {

    alert("Merchant ID: " + process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID)


    Promise.all([
      api.get("/license/status"),
      api.get("/auth/me"),
    ]).then(([licRes, userRes]) => {
      setLicense(licRes.data.data)
      setUser(userRes.data.data)
    }).catch(() => router.push("/login"))
      .finally(() => setLoading(false))

  }, [])

  const handlePayhere = () => {
    if (!agreed) {
      alert("කරුණාකර Terms & Conditions එකට agree වෙන්න!")
      return
    }

    const orderId = `DESHPOS-${user?.id}-${Date.now()}`

    const form = document.createElement("form")
    form.method = "POST"
    form.action = "https://sandbox.payhere.lk/pay/checkout"

    const fields: Record<string, string> = {
      merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || "",
      return_url: `${window.location.origin}/dashboard?payment=success`,
      cancel_url: `${window.location.origin}/payment?cancelled=true`,
      notify_url: `${process.env.NEXT_PUBLIC_API_URL}/license/payhere/notify`,
      order_id: orderId,
      items: "DeshPos Monthly Subscription",
      currency: "LKR",
      amount: "1000.00",
      first_name: user?.name?.split(" ")[0] || "User",
      last_name: user?.name?.split(" ").slice(1).join(" ") || "Account",
      email: user?.email || "",
      phone: user?.phone_number || "0770000000",
      address: "No 1",
      city: "Colombo",
      country: "Sri Lanka",
      custom_1: user?.id?.toString() || "",
    //   recurrence: "1 Month",
    //   duration: "Forever",
    //   startup_fee: "0.00",
    }

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = key
      input.value = value
      form.appendChild(input)
    })
    console.log("Fields being submitted:", fields)
    alert(JSON.stringify(fields, null, 2))



    document.body.appendChild(form)
    form.submit()
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-md mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">💳 Subscription</h1>
        </div>

        {license && (
          <div className={`border rounded-xl p-4 mb-6 ${
            license.status === "expired"
              ? "bg-red-500/10 border-red-500/30"
              : license.status === "trial"
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-green-500/10 border-green-500/30"
          }`}>
            <p className={`font-bold text-sm ${
              license.status === "expired" ? "text-red-400" :
              license.status === "trial" ? "text-blue-400" : "text-green-400"
            }`}>
              {license.status === "expired" ? "🔒 License Expired" :
               license.status === "trial" ? "🎁 Free Trial Active" : "✅ Subscription Active"}
            </p>
            {license.trial_end && (
              <p className="text-slate-400 text-xs mt-1">
                Trial ends: {new Date(license.trial_end).toLocaleDateString("en-LK")}
              </p>
            )}
            {license.paid_until && (
              <p className="text-slate-400 text-xs mt-1">
                Active until: {new Date(license.paid_until).toLocaleDateString("en-LK")}
              </p>
            )}
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <p className="text-slate-400 text-xs">Monthly Subscription</p>
            <p className="text-white font-black text-4xl mt-1">Rs.1,000</p>
            <p className="text-slate-500 text-xs mt-1">/ month — auto renews</p>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-700 pt-4">
            {[
              "✅ Unlimited sales & purchases",
              "✅ AI Business Assistant",
              "✅ Daily/Monthly profit reports",
              "✅ Customer & supplier management",
              "✅ Inventory & batch tracking",
              "✅ Receipt printing (BT/USB)",
            ].map((f, i) => (
              <p key={i} className="text-slate-300 text-sm">{f}</p>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-blue-500"
            />
            <span className="text-slate-300 text-xs leading-relaxed">
              මම Terms & Conditions වලට එකඟ වෙමි. මගේ card එකෙන් <b>සෑම මසකම</b> Rs.1,000 ක මුදලක් <b>ස්වයංක්‍රීයව (auto-debit)</b> අයකරගනු ලැබේ. මට ඕනෑම වෙලාවක subscription cancel කරගත හැක. Payment fail වුවහොත් system එක <b>read-only mode</b> එකට මාරු වේ.
            </span>
          </label>
        </div>

        <button
          onClick={handlePayhere}
          disabled={!agreed}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition">
          💳 Pay with PayHere
        </button>

        <p className="text-slate-500 text-xs text-center mt-3">
          🔒 Secure payment powered by PayHere
        </p>
      </div>
    </div>
  )
}