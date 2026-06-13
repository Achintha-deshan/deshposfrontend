"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { RootState } from "../../redux/store"
import api from "../../services/api"

const businessTypes = [
  { id: "grocery", icon: "🛒", name: "Grocery & Supermarket" },
  { id: "clothing", icon: "👕", name: "Clothing & Fashion" },
  { id: "phone", icon: "📱", name: "Phone & Accessories" },
  { id: "shoes", icon: "👟", name: "Shoes & Bags" },
  { id: "bike", icon: "🏍️", name: "Bike & Vehicle Parts" },
  { id: "auto", icon: "🚗", name: "Auto Parts & Oil Shop" },
  { id: "hardware", icon: "🔧", name: "Hardware Shop" },
  { id: "paint", icon: "🎨", name: "Paint Shop" },
  { id: "pharmacy", icon: "💊", name: "Pharmacy & Medical" },
  { id: "electronics", icon: "⚡", name: "Electronics Shop" },
  { id: "stationery", icon: "📚", name: "Stationery Shop" },
  { id: "cosmetics", icon: "🧴", name: "Cosmetics & Beauty" },
  { id: "furniture", icon: "🪑", name: "Furniture Shop" },
  { id: "agri", icon: "🌾", name: "Agricultural Supplies" },
]

interface Branch {
  name: string
  location: string
  phone: string
  is_main: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1
  const [selectedType, setSelectedType] = useState("")

  // Step 2
  const [businessName, setBusinessName] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 3
  const [hasBranches, setHasBranches] = useState<boolean | null>(null)
  const [branches, setBranches] = useState<Branch[]>([
    { name: "Main Branch", location: "", phone: "", is_main: true }
  ])

  // Step 4
  const [agreed, setAgreed] = useState(false)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoFile(file)
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const addBranch = () => {
    setBranches([...branches, { name: "", location: "", phone: "", is_main: false }])
  }

  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    const updated = [...branches]
    updated[index] = { ...updated[index], [field]: value }
    setBranches(updated)
  }

  const removeBranch = (index: number) => {
    if (index === 0) return
    setBranches(branches.filter((_, i) => i !== index))
  }

const handleSubmit = async () => {
  try {
    setLoading(true)
    setError("")

    const finalBranches = hasBranches
      ? branches
      : [{ name: "Main Branch", location: branches[0].location || "Main", phone: branches[0].phone || "", is_main: true }]

    const formData = new FormData()
    formData.append("business_name", businessName)
    formData.append("business_type", selectedType)
    formData.append("branches", JSON.stringify(finalBranches))

    if (logoFile) {
      formData.append("logo", logoFile)
      console.log("Logo attached:", logoFile.name)
    } else {
      console.log("No logo!")
    }

    await api.post("/business/setup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    router.push("/dashboard")
  } catch (err: any) {
    setError(err.response?.data?.message || "Setup failed!")
  } finally {
    setLoading(false)
  }
}
  const totalSteps = 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Desh<span className="text-blue-400">POS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Setup your business</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 <= step ? "bg-blue-500" : "bg-slate-700"
              }`} />
            </div>
          ))}
        </div>

        {/* Step 1 - Business Type */}
        {step === 1 && (
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Select business type</h2>
            <p className="text-slate-400 text-sm mb-6">We'll customize DeshPOS for you</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedType === type.id
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-xs font-medium">{type.name}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => selectedType && setStep(2)}
              disabled={!selectedType}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-40 text-sm"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 - Business Details */}
        {step === 2 && (
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Business details</h2>
            <p className="text-slate-400 text-sm mb-6">Tell us about your business</p>

            <div className="flex flex-col gap-4">
              {/* Logo Upload */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition"
              >
                {logoPreview ? (
                  <img src={logoPreview} className="w-24 h-24 object-contain mx-auto rounded-xl" />
                ) : (
                  <>
                    <div className="text-4xl mb-2">🏪</div>
                    <p className="text-slate-400 text-sm">Click to upload logo</p>
                    <p className="text-slate-600 text-xs mt-1">PNG, JPG (optional)</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Business Name</label>
                <input
                  type="text"
                  placeholder="Eg: Kasun's Shop"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl transition text-sm"
              >
                ← Back
              </button>
              <button
                onClick={() => businessName && setStep(3)}
                disabled={!businessName}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-40 text-sm"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Branches */}
        {step === 3 && (
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Branches</h2>
            <p className="text-slate-400 text-sm mb-6">Do you have multiple locations?</p>

            {/* Yes/No */}
            {hasBranches === null && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setHasBranches(true)}
                  className="p-6 border border-slate-700 bg-slate-800/50 rounded-xl text-center hover:border-blue-500 transition"
                >
                  <div className="text-3xl mb-2">🏪</div>
                  <div className="text-white font-semibold text-sm">Yes</div>
                  <div className="text-slate-500 text-xs mt-1">Multiple branches</div>
                </button>
                <button
                  onClick={() => { setHasBranches(false); }}
                  className="p-6 border border-slate-700 bg-slate-800/50 rounded-xl text-center hover:border-blue-500 transition"
                >
                  <div className="text-3xl mb-2">🏬</div>
                  <div className="text-white font-semibold text-sm">No</div>
                  <div className="text-slate-500 text-xs mt-1">Single location</div>
                </button>
              </div>
            )}

            {/* Branch Details */}
            {hasBranches === true && (
              <div className="flex flex-col gap-4">
                {branches.map((branch, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-sm font-medium">
                        {index === 0 ? "🏪 Main Branch" : `Branch ${index + 1}`}
                      </span>
                      {index > 0 && (
                        <button
                          onClick={() => removeBranch(index)}
                          className="text-red-400 text-xs hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Branch name"
                        value={branch.name}
                        onChange={(e) => updateBranch(index, "name", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Location (eg: Colombo 03)"
                        value={branch.location}
                        onChange={(e) => updateBranch(index, "location", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={branch.phone}
                        onChange={(e) => updateBranch(index, "phone", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addBranch}
                  className="w-full py-3 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 rounded-xl transition text-sm"
                >
                  + Add Another Branch
                </button>
              </div>
            )}

            {hasBranches === false && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Location (eg: Colombo 03)"
                    value={branches[0].location}
                    onChange={(e) => updateBranch(0, "location", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={branches[0].phone}
                    onChange={(e) => updateBranch(0, "phone", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}

            {hasBranches !== null && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setHasBranches(null)}
                  className="flex-1 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl transition text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm"
                >
                  Continue →
                </button>
              </div>
            )}

            {hasBranches === null && (
              <button
                onClick={() => setStep(2)}
                className="w-full mt-6 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl transition text-sm"
              >
                ← Back
              </button>
            )}
          </div>
        )}

        {/* Step 4 - Terms */}
        {step === 4 && (
          <div>
            <h2 className="text-white font-bold text-xl mb-1">Terms & Conditions</h2>
            <p className="text-slate-400 text-sm mb-6">Please read and agree to continue</p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-56 overflow-y-auto text-slate-400 text-sm leading-relaxed mb-6">
              <h3 className="text-white font-semibold mb-3">DeshPOS Terms of Service</h3>
              <p className="mb-3"><strong className="text-slate-300">1. Free Trial:</strong> 1 month free trial. No credit card required.</p>
              <p className="mb-3"><strong className="text-slate-300">2. Data Security:</strong> Your data is encrypted and stored securely.</p>
              <p className="mb-3"><strong className="text-slate-300">3. Payment:</strong> After trial, subscription fee applies.</p>
              <p className="mb-3"><strong className="text-slate-300">4. License:</strong> One license per business.</p>
              <p className="mb-3"><strong className="text-slate-300">5. Support:</strong> Available via WhatsApp and email.</p>
              <p><strong className="text-slate-300">6. Contact:</strong> support@deshpos.lk</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-slate-400 text-sm">
                I agree to the <span className="text-blue-400">Terms & Conditions</span>
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl transition text-sm"
              >
                ← Back
              </button>
              <button
                onClick={() => agreed && handleSubmit()}
                disabled={!agreed || loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-40 text-sm"
              >
                {loading ? "Setting up..." : "Start Free Trial 🚀"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}