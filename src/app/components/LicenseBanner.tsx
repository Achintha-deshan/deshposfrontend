"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"

export default function LicenseBanner() {
  const router = useRouter()
  const [license, setLicense] = useState<any>(null)

  useEffect(() => {
    api.get("/license/status")
      .then(res => setLicense(res.data.data))
      .catch(() => {})
  }, [])

  if (!license) return null

  if (license.status === "expired") {
    return (
      <div className="bg-red-600 px-4 py-2.5 flex justify-between items-center gap-3 sticky top-0 z-50">
        <p className="text-white text-xs font-medium">
          🔒 License expired! Read-only mode — new sales/purchases blocked.
        </p>
        <button
          onClick={() => router.push("/payment")}
          className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap">
          Pay Now
        </button>
      </div>
    )
  }

  const endDate = license.status === "trial" ? license.trial_end : license.paid_until
  if (!endDate) return null

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  if (daysLeft > 5) return null

  return (
    <div className="bg-yellow-500 px-4 py-2.5 flex justify-between items-center gap-3 sticky top-0 z-50">
      <p className="text-black text-xs font-medium">
        ⚠️ {license.status === "trial" ? "Free trial" : "Subscription"} expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}!
      </p>
      <button
        onClick={() => router.push("/payment")}
        className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold whitespace-nowrap">
        Renew Now
      </button>
    </div>
  )
}