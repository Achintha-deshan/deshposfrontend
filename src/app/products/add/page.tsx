"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getProductByBarcode,
  getProductBatchesApi,
  addProductApi,
  updateBatchApi,
  deleteBatchApi,
} from "../../../services/product"
import {
  getBatchNumberApi,
  createGRNApi,
} from "../../../services/purchase"
import api from "../../../services/api"

const categoryMap: Record<string, string[]> = {
  grocery: ["Food", "Beverages", "Cleaning", "Personal Care", "Dairy", "Snacks", "Frozen"],
  pharmacy: ["Medicine", "Vitamins", "Medical Equipment", "Baby Care", "Personal Care"],
  clothing: ["Tops", "Bottoms", "Dresses", "Accessories", "Underwear", "Sportswear"],
  shoes: ["Casual", "Formal", "Sports", "Sandals", "Kids", "Bags"],
  phone: ["Smartphones", "Accessories", "Chargers", "Cases", "Repair Parts"],
  electronics: ["TVs", "Audio", "Computers", "Appliances", "Lighting"],
  hardware: ["Tools", "Building Materials", "Electrical", "Plumbing", "Paint"],
  paint: ["Interior", "Exterior", "Primer", "Thinner", "Brushes"],
  bike: ["Engine Parts", "Body Parts", "Tyres", "Oils", "Accessories"],
  auto: ["Engine Parts", "Body Parts", "Tyres", "Oils", "Filters"],
  stationery: ["Books", "Pens", "Files", "Art Supplies", "Office Items"],
  cosmetics: ["Skincare", "Makeup", "Hair Care", "Perfumes", "Body Care"],
  furniture: ["Living Room", "Bedroom", "Kitchen", "Office", "Outdoor"],
  agri: ["Seeds", "Fertilizer", "Pesticides", "Tools", "Animal Feed"],
}

const buyUnitMap: Record<string, string[]> = {
  grocery: ["piece", "box", "pack", "bag", "case", "carton", "can", "bottle"],
  pharmacy: ["piece", "box", "case", "strip", "bottle"],
  clothing: ["piece", "pack", "dozen"],
  shoes: ["piece", "pair", "box"],
  phone: ["piece", "box"],
  electronics: ["piece", "box", "carton"],
  hardware: ["piece", "bundle", "roll", "bag", "box", "packet"],
  paint: ["piece", "carton", "drum", "bucket"],
  bike: ["piece", "set", "box"],
  auto: ["piece", "set", "box", "litre"],
  stationery: ["piece", "box", "pack", "ream", "dozen"],
  cosmetics: ["piece", "box", "carton", "dozen"],
  furniture: ["piece", "set", "carton"],
  agri: ["bag", "box", "pack", "litre", "piece"],
}

const sellUnitMap: Record<string, string[]> = {
  grocery: ["piece", "kg", "g", "litre", "ml", "pack"],
  pharmacy: ["piece", "strip", "bottle", "ml", "box"],
  clothing: ["piece"],
  shoes: ["piece", "pair"],
  phone: ["piece"],
  electronics: ["piece"],
  hardware: ["piece", "kg", "g", "metre", "feet"],
  paint: ["piece", "tin", "litre", "gallon"],
  bike: ["piece", "litre", "set"],
  auto: ["piece", "litre", "set"],
  stationery: ["piece", "pack", "box", "ream"],
  cosmetics: ["piece", "ml", "g", "box"],
  furniture: ["piece", "set"],
  agri: ["kg", "g", "litre", "ml", "pack", "piece"],
}

const businessDefaults: Record<string, any> = {
  pharmacy: { has_expiry: true, has_variants: false, has_serial: false },
  grocery: { has_expiry: false, has_variants: false, has_serial: false },
  cosmetics: { has_expiry: true, has_variants: false, has_serial: false },
  agri: { has_expiry: true, has_variants: false, has_serial: false },
  clothing: { has_expiry: false, has_variants: true, has_serial: false },
  shoes: { has_expiry: false, has_variants: true, has_serial: false },
  phone: { has_expiry: false, has_variants: true, has_serial: true },
  electronics: { has_expiry: false, has_variants: true, has_serial: true },
  hardware: { has_expiry: false, has_variants: false, has_serial: false },
  paint: { has_expiry: false, has_variants: false, has_serial: false },
  bike: { has_expiry: false, has_variants: false, has_serial: false },
  auto: { has_expiry: false, has_variants: false, has_serial: false },
  stationery: { has_expiry: false, has_variants: false, has_serial: false },
  furniture: { has_expiry: false, has_variants: true, has_serial: false },
}

export default function AddProductPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [businessType, setBusinessType] = useState("")
  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [buyUnits, setBuyUnits] = useState<string[]>(["piece"])
  const [sellUnits, setSellUnits] = useState<string[]>(["piece"])
  const [barcodeSearching, setBarcodeSearching] = useState(false)
  const [existingProduct, setExistingProduct] = useState<any>(null)
  const [existingBatches, setExistingBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [batchMode, setBatchMode] = useState<"new" | "update">("new")
  const [showBatchPopup, setShowBatchPopup] = useState(false)

  const [form, setForm] = useState({
    branch_id: "",
    name: "",
    barcode: "",
    category: "",
    print_price: "",
    buy_price: "",
    sell_price: "",
    stock: "",
    min_stock: "",
    low_stock_alert: "5",
    buy_unit: "piece",
    sell_unit: "piece",
    conversion_rate: "1",
    unit_type: "piece",
    has_variants: false,
    has_expiry: false,
    has_serial: false,
    is_returnable: false,
    return_days: "0",
    part_number: "",
    supplier_id: "",
    notes: "",
  })

  const [variants, setVariants] = useState([
    { color: "", size: "", stock: "", barcode: "" }
  ])

  const [batch, setBatch] = useState({
    batch_number: "",
    expiry_date: "",
    quantity: "",
  })

  const getAllCategories = () => {
    const defaults = categoryMap[businessType] || []
    return [...new Set([...defaults, ...dbCategories])]
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [bizRes, catRes, batchNumber] = await Promise.all([
          api.get("/business/me"),
          api.get("/products/categories"),
          getBatchNumberApi(),
        ])
        const biz = bizRes.data.data.business
        const brs = bizRes.data.data.branches
        setBranches(brs)
        setBusinessType(biz.business_type)
        setDbCategories(catRes.data.data || [])
        setBuyUnits(buyUnitMap[biz.business_type] || ["piece"])
        setSellUnits(sellUnitMap[biz.business_type] || ["piece"])
        const defaults = businessDefaults[biz.business_type] || {}
        const main = brs.find((b: any) => b.is_main)
        const defaultBuyUnit = (buyUnitMap[biz.business_type] || ["piece"])[0]
        const defaultSellUnit = (sellUnitMap[biz.business_type] || ["piece"])[0]
        setBatch(b => ({ ...b, batch_number: batchNumber }))
        setForm(f => ({
          ...f,
          branch_id: main ? main.id.toString() : "",
          has_expiry: defaults.has_expiry || false,
          has_variants: defaults.has_variants || false,
          has_serial: defaults.has_serial || false,
          buy_unit: defaultBuyUnit,
          sell_unit: defaultSellUnit,
          unit_type: defaultSellUnit,
        }))
      } catch {
        router.push("/login")
      }
    }
    load()
  }, [])

  const handleBarcodeSearch = async (barcode?: string) => {
    const code = barcode || form.barcode
    if (!code.trim()) return
    setBarcodeSearching(true)
    try {
      const [product, batchNumber] = await Promise.all([
        getProductByBarcode(code),
        getBatchNumberApi(),
      ])
      setExistingProduct(product)
      const batches = await getProductBatchesApi(product.id)
      setExistingBatches(Array.isArray(batches) ? batches : [])
      setBatchMode("new")
      setSelectedBatch(null)
      setBatch({ batch_number: batchNumber, expiry_date: "", quantity: "" })
      setForm(f => ({
        ...f,
        name: product.name,
        category: product.category || "",
        buy_price: product.buy_price.toString(),
        sell_price: product.sell_price.toString(),
        print_price: product.print_price?.toString() || "",
        unit_type: product.unit_type,
        buy_unit: product.buy_unit || product.unit_type,
        sell_unit: product.sell_unit || product.unit_type,
        conversion_rate: product.conversion_rate?.toString() || "1",
        has_expiry: product.has_expiry,
        has_variants: product.has_variants,
        has_serial: product.has_serial,
        low_stock_alert: product.low_stock_alert?.toString() || "5",
        min_stock: product.min_stock?.toString() || "0",
      }))
      setShowBatchPopup(true)
    } catch {
      setExistingProduct(null)
      setExistingBatches([])
    } finally {
      setBarcodeSearching(false)
    }
  }

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const reader = new BrowserMultiFormatReader()
      const url = URL.createObjectURL(file)
      const result = await reader.decodeFromImageUrl(url)
      const barcode = result.getText()
      setForm(f => ({ ...f, barcode }))
      await handleBarcodeSearch(barcode)
    } catch {
      setError("Barcode not detected! Try again.")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addVariant = () => setVariants([...variants, { color: "", size: "", stock: "", barcode: "" }])
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index))
  const updateVariant = (index: number, field: string, value: string) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const actualStock = form.has_variants
    ? variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
    : Number(form.stock || 0) * Number(form.conversion_rate || 1)

  const handleDeleteBatch = async (batchId: number, productId: number) => {
    if (!confirm("Delete this batch?")) return
    try {
      await deleteBatchApi(batchId, productId)
      setExistingBatches(prev => prev.filter(x => x.id !== batchId))
      if (selectedBatch?.id === batchId) { setSelectedBatch(null); setBatchMode("new") }
      if (existingProduct) {
        const updated = await getProductByBarcode(existingProduct.barcode)
        setExistingProduct(updated)
      }
    } catch { setError("Failed to delete batch!") }
  }

  const handleSelectBatch = (b: any) => {
    setSelectedBatch(b)
    setBatchMode("update")
    setBatch({
      batch_number: b.batch_number,
      expiry_date: b.expiry_date?.split("T")[0] || "",
      quantity: b.quantity.toString(),
    })
    setForm(f => ({
      ...f,
      buy_price: b.buy_price.toString(),
      sell_price: b.sell_price?.toString() || f.sell_price,
    }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.sell_price || !form.branch_id) {
      return setError("Name, Sell Price and Branch required!")
    }
    try {
      setLoading(true)
      setError("")

      if (existingProduct && batchMode === "update" && selectedBatch) {
        await updateBatchApi(selectedBatch.id, {
          quantity: Number(batch.quantity),
          buy_price: Number(form.buy_price),
          sell_price: Number(form.sell_price),
          expiry_date: batch.expiry_date || undefined,
        })
        setSuccess("Batch updated! ✅")
        setTimeout(() => router.push("/products"), 1500)
        return
      }

      if (existingProduct && batchMode === "new") {
        await createGRNApi({
          branch_id: Number(form.branch_id),
          supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
          items: [{
            product_id: existingProduct.id,
            product_name: existingProduct.name,
            barcode: existingProduct.barcode,
            category: existingProduct.category,
            quantity: Number(form.stock) * Number(form.conversion_rate || 1),
            buy_price: Number(form.buy_price) || Number(existingProduct.buy_price),
            sell_price: Number(form.sell_price) || Number(existingProduct.sell_price),
            unit_type: form.sell_unit || existingProduct.unit_type,
            has_expiry: form.has_expiry,
            batch_number: batch.batch_number || undefined,
            expiry_date: batch.expiry_date || undefined,
            is_new_product: false,
          }],
          payment: { payment_type: "cash", paid_amount: 0, discount: 0 },
        })
        setSuccess("Stock updated! ✅")
        setTimeout(() => router.push("/products"), 1500)
        return
      }

      const formData = new FormData()
      formData.append("branch_id", form.branch_id)
      formData.append("name", form.name)
      formData.append("barcode", form.barcode)
      formData.append("category", form.category === "__custom__" ? "" : form.category)
      formData.append("print_price", form.print_price || "0")
      formData.append("buy_price", form.buy_price || "0")
      formData.append("sell_price", form.sell_price)
      formData.append("stock", form.stock || "0")
      formData.append("min_stock", form.min_stock || "0")
      formData.append("low_stock_alert", form.low_stock_alert)
      formData.append("buy_unit", form.buy_unit)
      formData.append("sell_unit", form.sell_unit)
      formData.append("unit_type", form.sell_unit)
      formData.append("conversion_rate", form.conversion_rate)
      formData.append("has_variants", form.has_variants.toString())
      formData.append("has_expiry", form.has_expiry.toString())
      formData.append("has_serial", form.has_serial.toString())
      formData.append("is_returnable", form.is_returnable.toString())
      formData.append("return_days", form.return_days)
      formData.append("part_number", form.part_number || "")
      formData.append("notes", form.notes || "")
      if (form.supplier_id) formData.append("supplier_id", form.supplier_id)
      if (imageFile) formData.append("image", imageFile)
      if (form.has_variants) formData.append("variants", JSON.stringify(variants))
      if (batch.batch_number) {
        formData.append("batch", JSON.stringify({
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date || undefined,
          quantity: actualStock,
        }))
      }

      await addProductApi(formData)
      setSuccess("Product added! ✅")
      setTimeout(() => router.push("/products"), 1500)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed!"
      setError(msg.includes("Barcode already exists")
        ? msg + " — Scan barcode to update stock!"
        : msg)
    } finally {
      setLoading(false)
    }
  }

  const allCategories = getAllCategories()

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/products")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">
            {existingProduct ? "📦 Update Stock" : "➕ Add Product"}
          </h1>
          {existingProduct && (
            <button
              onClick={() => {
                setExistingProduct(null)
                setExistingBatches([])
                setSelectedBatch(null)
                setBatchMode("new")
                setForm(f => ({ ...f, barcode: "", name: "" }))
              }}
              className="ml-auto text-xs text-slate-500 hover:text-red-400 bg-slate-800 px-2 py-1 rounded-lg">
              ✕ Clear
            </button>
          )}
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

        {/* Existing Product Banner */}
        {existingProduct && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-400 text-sm font-bold">📦 {existingProduct.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {existingProduct.product_code} · Stock: {existingProduct.stock} {existingProduct.unit_type}
                </p>
              </div>
              {batchMode === "update" && selectedBatch && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-2 py-1">
                  <p className="text-yellow-400 text-xs">✏️ {selectedBatch.batch_number}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Barcode — always first */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <label className="text-slate-400 text-xs mb-2 block">🔍 Barcode / Product Search</label>
            <div className="flex gap-2">
              <input ref={barcodeRef} type="text"
                placeholder="Scan or enter barcode..."
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                autoFocus
              />
              <button onClick={() => handleBarcodeSearch()} disabled={barcodeSearching}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium">
                {barcodeSearching ? "⏳" : "🔍"}
              </button>
              <label className="px-3 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm cursor-pointer">
                📷
                <input type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
              </label>
              {!existingProduct && !form.barcode && (
                <button
                  onClick={() => {
                    const generated = "200" + Date.now().toString().slice(-9)
                    setForm(f => ({ ...f, barcode: generated }))
                  }}
                  className="px-3 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium whitespace-nowrap">
                  🔢 Gen
                </button>
              )}
            </div>
            <p className="text-slate-600 text-xs mt-2">
              Existing product scan → batch list show · New barcode → add new product
              {!existingProduct && !form.barcode && " · No barcode? Click Gen!"}
            </p>
          </div>

          {/* Image — only for new product */}
          {!existingProduct && (
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition">
              {imagePreview ? (
                <img src={imagePreview} className="w-20 h-20 object-contain mx-auto rounded-xl" alt="preview" />
              ) : (
                <div>
                  <div className="text-3xl mb-1">📸</div>
                  <p className="text-slate-400 text-xs">Tap to add photo (optional)</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
          )}

          {/* Branch */}
          {branches.length > 1 && (
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Branch</label>
              <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
                ))}
              </select>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Product Name *</label>
            <input type="text" placeholder="Eg: Basmati Rice"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              readOnly={!!existingProduct}
              className={`w-full px-4 py-3 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none ${
                existingProduct
                  ? "bg-slate-800/30 border-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-slate-800 border-slate-600/50 focus:ring-2 focus:ring-blue-500/50"
              }`}
            />
          </div>

          {/* Category */}
          {!existingProduct && (
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
                <option value="">Select category</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ Add New Category</option>
              </select>
              {form.category === "__custom__" && (
                <input type="text" placeholder="Type new category name" autoFocus
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-slate-800 border border-blue-500/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                />
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white text-sm font-medium mb-3">💰 Pricing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 text-xs">Buy Price (Rs.)</label>
                <input type="number" placeholder="0.00" value={form.buy_price}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Sell Price (Rs.) *</label>
                <input type="number" placeholder="0.00" value={form.sell_price}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Print/MRP Price (Rs.)</label>
                <input type="number" placeholder="0.00" value={form.print_price}
                  onChange={(e) => setForm({ ...form, print_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              {form.buy_price && form.sell_price && Number(form.buy_price) > 0 && (
                <div className="flex items-end pb-1">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 w-full">
                    {(() => {
                      const costPerSellUnit = Number(form.buy_price) / Number(form.conversion_rate || 1)
                      const profit = Number(form.sell_price) - costPerSellUnit
                      const profitPct = costPerSellUnit > 0 ? (profit / costPerSellUnit) * 100 : 0
                      return (
                        <>
                          <p className="text-slate-400 text-xs">
                            Cost/{form.sell_unit}: Rs.{costPerSellUnit.toFixed(2)}
                          </p>
                          <p className="text-green-400 text-xs font-medium mt-0.5">
                            Profit: Rs.{profit.toFixed(2)} ({profitPct.toFixed(1)}%)
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock + Units */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white text-sm font-medium mb-3">📦 Stock & Units</h3>

            {!existingProduct && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-slate-500 text-xs">Buy Unit</label>
                  <select value={form.buy_unit}
                    onChange={(e) => setForm({ ...form, buy_unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1">
                    {buyUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-xs">Sell Unit</label>
                  <select value={form.sell_unit}
                    onChange={(e) => setForm({ ...form, sell_unit: e.target.value, unit_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1">
                    {sellUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            )}

            {form.buy_unit !== form.sell_unit && !existingProduct && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-3">
                <p className="text-blue-400 text-xs mb-2">📦 Unit Conversion</p>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">1 {form.buy_unit} =</span>
                  <input type="number" value={form.conversion_rate}
                    onChange={(e) => setForm({ ...form, conversion_rate: e.target.value })}
                    className="w-20 px-2 py-1.5 bg-slate-900 border border-blue-500/50 rounded-lg text-white text-sm text-center focus:outline-none"
                  />
                  <span className="text-white text-sm">{form.sell_unit}</span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {[6, 10, 12, 24, 25, 48, 50, 100, 200].map(n => (
                    <button key={n}
                      onClick={() => setForm({ ...form, conversion_rate: n.toString() })}
                      className={`px-2 py-0.5 rounded text-xs transition ${
                        form.conversion_rate === n.toString()
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:text-white"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-500 text-xs">
                  {existingProduct ? "Add Stock" : "Stock"} ({form.buy_unit})
                </label>
                <input type="number" placeholder="0" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Min Stock</label>
                <input type="number" placeholder="0" value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs">Alert Level</label>
                <input type="number" placeholder="5" value={form.low_stock_alert}
                  onChange={(e) => setForm({ ...form, low_stock_alert: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-orange-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
            </div>

            {form.stock && Number(form.stock) > 0 && (
              <div className="mt-2 bg-slate-900/50 rounded-lg px-3 py-2">
                <p className="text-slate-400 text-xs">
                  {existingProduct ? "Adding" : "Actual"} stock:{" "}
                  <span className="text-white font-medium">{actualStock} {form.sell_unit}</span>
                  {form.buy_unit !== form.sell_unit && (
                    <span className="text-slate-500"> ({form.stock} {form.buy_unit} × {form.conversion_rate})</span>
                  )}
                </p>
                {existingProduct && (
                  <p className="text-blue-400 text-xs mt-1">
                    New total: {Number(existingProduct.stock) + actualStock} {form.sell_unit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Product Settings — only new */}
          {!existingProduct && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-3">⚙️ Product Settings</h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: "has_expiry", label: "⚠️ Has Expiry Date", color: "accent-yellow-500" },
                  { key: "has_variants", label: "🎨 Has Variants (Size/Color)", color: "accent-purple-500" },
                  { key: "has_serial", label: "📱 Has Serial/IMEI", color: "accent-blue-500" },
                  { key: "is_returnable", label: "↩️ Returnable", color: "accent-green-500" },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-400 text-sm">{toggle.label}</span>
                    <input type="checkbox"
                      checked={form[toggle.key as keyof typeof form] as boolean}
                      onChange={(e) => setForm({ ...form, [toggle.key]: e.target.checked })}
                      className={`w-4 h-4 ${toggle.color}`}
                    />
                  </label>
                ))}
              </div>
              {form.is_returnable && (
                <div className="mt-3">
                  <label className="text-slate-500 text-xs">Return Days</label>
                  <input type="number" placeholder="7" value={form.return_days}
                    onChange={(e) => setForm({ ...form, return_days: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Batch Section */}
          <div className={`border rounded-xl p-4 ${
            batchMode === "update"
              ? "bg-yellow-500/5 border-yellow-500/30"
              : form.has_expiry
                ? "bg-slate-800/50 border-yellow-500/30"
                : "bg-slate-800/50 border-slate-700"
          }`}>
            <h3 className={`text-sm font-medium mb-3 ${
              batchMode === "update" ? "text-yellow-400" :
              form.has_expiry ? "text-yellow-400" : "text-white"
            }`}>
              🏷️ {batchMode === "update" ? `Editing: ${selectedBatch?.batch_number}` :
                form.has_expiry ? "Batch & Expiry" : "Batch Number"}
            </h3>

            <div className="flex gap-2 mb-2">
              <input type="text"
                placeholder="Batch Number"
                value={batch.batch_number}
                onChange={(e) => setBatch({ ...batch, batch_number: e.target.value })}
                className={`flex-1 px-3 py-2 bg-slate-900 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none border ${
                  batchMode === "update" ? "border-yellow-500/50" :
                  form.has_expiry ? "border-yellow-500/30" : "border-slate-600/50"
                }`}
              />
              {batchMode === "new" && (
                <button
                  onClick={async () => {
                    const num = await getBatchNumberApi()
                    setBatch(b => ({ ...b, batch_number: num }))
                  }}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 text-slate-400 hover:text-white rounded-lg text-xs">
                  🔄 Auto
                </button>
              )}
              {batchMode === "update" && (
                <button
                  onClick={() => {
                    setSelectedBatch(null)
                    setBatchMode("new")
                    setBatch(b => ({ ...b, expiry_date: "", quantity: "" }))
                  }}
                  className="px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                  + New
                </button>
              )}
            </div>

            {form.has_expiry && (
              <input type="date" value={batch.expiry_date}
                onChange={(e) => setBatch({ ...batch, expiry_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-yellow-500/30 rounded-lg text-white text-sm focus:outline-none mb-2"
              />
            )}

            {batchMode === "update" && (
              <div className="mt-2">
                <label className="text-slate-500 text-xs">Updated Quantity ({form.sell_unit})</label>
                <input type="number" placeholder="0" value={batch.quantity}
                  onChange={(e) => setBatch({ ...batch, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-yellow-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                />
              </div>
            )}
          </div>

          {/* Variants — only new */}
          {form.has_variants && !existingProduct && (
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4">
              <h3 className="text-purple-400 text-sm font-medium mb-3">🎨 Variants</h3>
              {variants.map((v, i) => (
                <div key={i} className="mb-3 p-3 bg-slate-900/50 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Color (Red)" value={v.color}
                      onChange={(e) => updateVariant(i, "color", e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                    />
                    <input type="text" placeholder="Size (M/L/XL)" value={v.size}
                      onChange={(e) => updateVariant(i, "size", e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                    />
                    <input type="number" placeholder="Stock" value={v.stock}
                      onChange={(e) => updateVariant(i, "stock", e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                    />
                    <input type="text" placeholder="Barcode" value={v.barcode}
                      onChange={(e) => updateVariant(i, "barcode", e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                    />
                  </div>
                  {variants.length > 1 && (
                    <button onClick={() => removeVariant(i)}
                      className="w-full mt-2 py-1 text-red-400 text-xs">Remove ❌</button>
                  )}
                </div>
              ))}
              <button onClick={addVariant}
                className="w-full py-2 border border-dashed border-purple-500/50 text-purple-400 rounded-lg text-sm">
                + Add Variant
              </button>
            </div>
          )}

          {/* Notes */}
          {!existingProduct && (
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Notes (optional)</label>
              <textarea placeholder="Any notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-4 text-white font-semibold rounded-xl transition disabled:opacity-40 ${
              existingProduct
                ? batchMode === "update"
                  ? "bg-yellow-600 hover:bg-yellow-500"
                  : "bg-green-600 hover:bg-green-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}>
            {loading ? "Saving..." :
              existingProduct
                ? batchMode === "update" ? "✏️ Update Batch" : "➕ Add Stock"
                : "✅ Add Product"
            }
          </button>
        </div>
      </div>

      {/* ✅ Batch Select Popup */}
      {showBatchPopup && existingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold">{existingProduct.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {existingProduct.product_code} · 
                  <span className={`ml-1 font-medium ${
                    Number(existingProduct.stock) <= 0 ? "text-red-400" :
                    Number(existingProduct.stock) <= 5 ? "text-orange-400" : "text-green-400"
                  }`}>
                    Stock: {existingProduct.stock} {existingProduct.unit_type}
                  </span>
                </p>
              </div>
              <button onClick={() => setShowBatchPopup(false)}
                className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Existing Batches */}
            {existingBatches.length > 0 && (
              <>
                <p className="text-slate-400 text-xs mb-2 font-medium">
                  📋 Select batch to update:
                </p>
                <div className="flex flex-col gap-2 mb-3">
                  {existingBatches.map((b: any) => {
                    const isExpired = b.expiry_date && new Date(b.expiry_date) < new Date()
                    const isNear = b.expiry_date &&
                      new Date(b.expiry_date) > new Date() &&
                      new Date(b.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                    return (
                      <button key={b.id}
                        onClick={() => {
                          handleSelectBatch(b)
                          setShowBatchPopup(false)
                        }}
                        className={`p-3 rounded-xl border text-left transition hover:scale-[1.01] active:scale-[0.99] ${
                          isExpired
                            ? "border-red-500/30 bg-red-500/5 opacity-60"
                            : isNear
                              ? "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10"
                              : "border-slate-600 bg-slate-900/50 hover:bg-slate-700/50"
                        }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white text-sm font-bold">{b.batch_number}</p>
                            <p className="text-slate-400 text-xs">
                              Qty: {Number(b.quantity).toFixed(2)} {existingProduct.unit_type}
                            </p>
                            {b.expiry_date && (
                              <p className={`text-xs mt-0.5 ${
                                isExpired ? "text-red-400" :
                                isNear ? "text-yellow-400" : "text-slate-500"
                              }`}>
                                {isExpired ? "🚨 Expired: " : isNear ? "⏰ " : "📅 "}
                                {new Date(b.expiry_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-blue-400 text-xs">Buy: Rs.{Number(b.buy_price).toFixed(2)}</p>
                            {b.sell_price && (
                              <p className="text-green-400 text-xs">Sell: Rs.{Number(b.sell_price).toFixed(2)}</p>
                            )}
                            <p className="text-slate-500 text-xs mt-1">✏️ Edit</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="border-t border-slate-700 mb-3" />
              </>
            )}

            {/* New Stock */}
            <button
              onClick={() => {
                setSelectedBatch(null)
                setBatchMode("new")
                setShowBatchPopup(false)
              }}
              className="w-full py-3 bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 rounded-xl text-sm font-medium transition">
              ➕ Add New Stock / New Batch
            </button>
          </div>
        </div>
      )}
    </div>
  )
}