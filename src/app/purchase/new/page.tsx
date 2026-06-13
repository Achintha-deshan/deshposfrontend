"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  getProductByBarcode,
  searchProductsApi,
} from "../../../services/product"
import {
  getSuppliersApi,
  getCheckNumberApi,
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
  paint: ["Interior", "Exterior", "Primer", "Thinner", "Brushes", "Rollers"],
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

const businessDefaults: Record<string, { has_expiry: boolean; has_variants: boolean; has_serial: boolean }> = {
  pharmacy: { has_expiry: true, has_variants: false, has_serial: false },
  grocery: { has_expiry: true, has_variants: false, has_serial: false },
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

interface PurchaseItem {
  product_id?: number
  product_name: string
  barcode?: string
  category?: string
  quantity: number
  buy_price: number
  sell_price: number
  print_price?: number
  unit_type: string
  buy_unit?: string
  sell_unit?: string
  conversion_rate?: number
  min_stock?: number
  low_stock_alert?: number
  expiry_date?: string
  batch_number?: string
  has_expiry?: boolean
  has_variants?: boolean
  has_serial?: boolean
  is_returnable?: boolean
  return_days?: number
  part_number?: string
  notes?: string
  is_new_product?: boolean
  variants?: { color?: string; size?: string; stock: string; barcode?: string }[]
}

export default function NewPurchasePage() {
  const router = useRouter()
  const barcodeRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [buyUnits, setBuyUnits] = useState<string[]>(["piece"])
  const [sellUnits, setSellUnits] = useState<string[]>(["piece"])
  const [businessType, setBusinessType] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scanning, setScanning] = useState(false)
  const [batchCounter, setBatchCounter] = useState(1)

  const [supplierId, setSupplierId] = useState("")
  const [branchId, setBranchId] = useState("")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])

  const [paymentType, setPaymentType] = useState("cash")
  const [paidAmount, setPaidAmount] = useState("")
  const [discount, setDiscount] = useState("0")
  const [checkNumber, setCheckNumber] = useState("")
  const [checkDate, setCheckDate] = useState("")
  const [notes, setNotes] = useState("")

  const [foundProduct, setFoundProduct] = useState<any>(null)
  const [showProductOptions, setShowProductOptions] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const getDefaultQuickAdd = (biz: string) => {
    const defaults = businessDefaults[biz] || { has_expiry: false, has_variants: false, has_serial: false }
    return {
      product_name: "",
      barcode: "",
      category: "",
      buy_price: "",
      sell_price: "",
      print_price: "",
      quantity: "",
      buy_unit: (buyUnitMap[biz] || ["piece"])[0],
      sell_unit: (sellUnitMap[biz] || ["piece"])[0],
      conversion_rate: "1",
      min_stock: "0",
      low_stock_alert: "5",
      has_expiry: defaults.has_expiry,
      expiry_date: "",
      batch_number: "",
      has_variants: defaults.has_variants,
      has_serial: defaults.has_serial,
      is_returnable: false,
      return_days: "0",
      part_number: "",
      notes: "",
      variants: [{ color: "", size: "", stock: "", barcode: "" }],
    }
  }

  const [quickAdd, setQuickAdd] = useState(getDefaultQuickAdd(""))

  const getNextBatchNumber = () => {
    const year = new Date().getFullYear()
    const num = `BAT-${year}-${String(batchCounter).padStart(4, "0")}`
    setBatchCounter(c => c + 1)
    return num
  }

  const getAllCategories = () => {
    const defaults = categoryMap[businessType] || []
    return [...new Set([...defaults, ...dbCategories])]
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [bizRes, catRes, suppliersList] = await Promise.all([
          api.get("/business/me"),
          api.get("/products/categories"),
          getSuppliersApi(),
        ])
        const biz = bizRes.data.data.business
        setBranches(bizRes.data.data.branches)
        setSuppliers(suppliersList)
        setBusinessType(biz.business_type)
        setDbCategories(catRes.data.data || [])
        setBuyUnits(buyUnitMap[biz.business_type] || ["piece"])
        setSellUnits(sellUnitMap[biz.business_type] || ["piece"])
        setQuickAdd(getDefaultQuickAdd(biz.business_type))
        const main = bizRes.data.data.branches.find((b: any) => b.is_main)
        if (main) setBranchId(main.id.toString())
      } catch {
        router.push("/login")
      }
    }
    load()
  }, [])

  const totalAmount = items.reduce(
    (sum, item) => sum + item.buy_price * item.quantity, 0
  ) - Number(discount || 0)

  const outstanding = totalAmount - Number(paidAmount || 0)

  const startCameraScan = async () => {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      setScanning(true)
      const reader = new BrowserMultiFormatReader()
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear")
      ) || devices[devices.length - 1]

      const controls = await reader.decodeFromVideoDevice(
        backCamera?.deviceId,
        videoRef.current!,
        (result) => {
          if (result) {
            const barcode = result.getText()
            if (controls) controls.stop()
            setScanning(false)
            handleBarcodeSearch(barcode)
          }
        }
      )
    } catch {
      setError("Camera access failed! Use HTTPS or try manual input.")
      setScanning(false)
    }
  }

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const reader = new BrowserMultiFormatReader()
      const url = URL.createObjectURL(file)
      const result = await reader.decodeFromImageUrl(url)
      handleBarcodeSearch(result.getText())
    } catch {
      setError("Barcode not detected! Try again.")
    }
  }

  const handleBarcodeSearch = async (barcode?: string) => {
    const code = barcode || barcodeInput
    if (!code.trim()) return

    try {
      const product = await getProductByBarcode(code)
      const existing = items.find(i => i.product_id === product.id)
      if (existing) {
        setItems(items.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ))
      } else {
        setFoundProduct(product)
        setShowProductOptions(true)
      }
      setBarcodeInput("")
    } catch {
      if (code.length > 2) {
        try {
          const products = await searchProductsApi(code)
          if (products.length === 1) {
            setFoundProduct(products[0])
            setShowProductOptions(true)
            setBarcodeInput("")
            return
          }
        } catch {}
      }
      const defaults = businessDefaults[businessType] || { has_expiry: false, has_variants: false, has_serial: false }
      setQuickAdd(q => ({
        ...q,
        barcode: code.match(/^\d+$/) ? code : "",
        product_name: code.match(/^\d+$/) ? "" : code,
        batch_number: defaults.has_expiry ? getNextBatchNumber() : "",
        has_expiry: defaults.has_expiry,
        has_variants: defaults.has_variants,
        has_serial: defaults.has_serial,
      }))
      setShowQuickAdd(true)
      setBarcodeInput("")
    }
  }

  const handlePaymentTypeChange = async (type: string) => {
    setPaymentType(type)
    if (type === "check") {
      try {
        const checkNum = await getCheckNumberApi()
        setCheckNumber(checkNum)
      } catch {}
    }
  }

  const handleQuickAdd = () => {
    if (!quickAdd.product_name || !quickAdd.sell_price) return

    const conversionRate = Number(quickAdd.conversion_rate) || 1
    const totalStock = quickAdd.has_variants
      ? quickAdd.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
      : Number(quickAdd.quantity) * conversionRate || 1

    setItems([...items, {
      product_name: quickAdd.product_name,
      barcode: quickAdd.barcode || undefined,
      category: quickAdd.category || undefined,
      quantity: totalStock,
      buy_price: Number(quickAdd.buy_price) || 0,
      sell_price: Number(quickAdd.sell_price),
      print_price: Number(quickAdd.print_price) || 0,
      unit_type: quickAdd.sell_unit || "piece",
      buy_unit: quickAdd.buy_unit,
      sell_unit: quickAdd.sell_unit,
      conversion_rate: conversionRate,
      min_stock: Number(quickAdd.min_stock) || 0,
      low_stock_alert: Number(quickAdd.low_stock_alert) || 5,
      has_expiry: quickAdd.has_expiry,
      has_variants: quickAdd.has_variants,
      has_serial: quickAdd.has_serial,
      is_returnable: quickAdd.is_returnable,
      return_days: Number(quickAdd.return_days) || 0,
      part_number: quickAdd.part_number || undefined,
      notes: quickAdd.notes || undefined,
      expiry_date: quickAdd.expiry_date || undefined,
      batch_number: quickAdd.batch_number || undefined,
      is_new_product: true,
      variants: quickAdd.has_variants ? quickAdd.variants : undefined,
    }])

    setShowQuickAdd(false)
    setQuickAdd(getDefaultQuickAdd(businessType))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (items.length === 0) return setError("Add at least one product!")
    try {
      setLoading(true)
      setError("")
      await createGRNApi({
        branch_id: Number(branchId),
        supplier_id: supplierId ? Number(supplierId) : null,
        items,
        payment: {
          payment_type: paymentType,
          paid_amount: Number(paidAmount) || totalAmount,
          discount: Number(discount) || 0,
          check_number: checkNumber || undefined,
          check_date: checkDate || undefined,
          notes: notes || undefined,
        },
      })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed!")
    } finally {
      setLoading(false)
    }
  }

  const allCategories = getAllCategories()

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold text-xl">New Purchase (GRN)</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Supplier + Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Supplier (optional)</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
                <option value="">Walk-in / No Supplier</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} - {b.location}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Barcode Search */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <label className="text-slate-400 text-xs mb-2 block">Scan / Search Product</label>
            <div className="flex gap-2">
              <input ref={barcodeRef} type="text"
                placeholder="Barcode or product name..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                autoFocus
              />
              <button onClick={() => handleBarcodeSearch()}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm">
                🔍
              </button>
              <button onClick={startCameraScan}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm">
                📷
              </button>
              <label className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm cursor-pointer">
                📸
                <input type="file" accept="image/*" capture="environment"
                  onChange={handleImageCapture} className="hidden" />
              </label>
              <button onClick={() => {
                const defaults = businessDefaults[businessType] || { has_expiry: false, has_variants: false, has_serial: false }
                setQuickAdd(q => ({
                  ...q,
                  barcode: barcodeInput,
                  batch_number: defaults.has_expiry ? getNextBatchNumber() : "",
                  has_expiry: defaults.has_expiry,
                  has_variants: defaults.has_variants,
                  has_serial: defaults.has_serial,
                }))
                setShowQuickAdd(true)
              }}
                className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm">
                + New
              </button>
            </div>

            {scanning && (
              <div className="mt-3 relative">
                <video ref={videoRef} className="w-full rounded-xl max-h-48 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400" />
                  </div>
                </div>
                <button onClick={() => setScanning(false)}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-xs">
                  Stop ✕
                </button>
              </div>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-white text-sm font-medium">Items ({items.length})</h3>
                <span className="text-slate-500 text-xs">
                  Total: Rs. {items.reduce((s, i) => s + i.buy_price * i.quantity, 0).toLocaleString()}
                </span>
              </div>
              {items.map((item, index) => (
                <div key={index} className="p-4 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-medium">{item.product_name}</p>
                      <div className="flex gap-2 flex-wrap mt-0.5">
                        {item.barcode && <span className="text-slate-500 text-xs">📦 {item.barcode}</span>}
                        {item.batch_number && <span className="text-yellow-500 text-xs">🏷️ {item.batch_number}</span>}
                        {item.category && <span className="text-slate-500 text-xs">📁 {item.category}</span>}
                        {item.is_new_product && <span className="text-green-400 text-xs">✨ New</span>}
                        {item.has_expiry && <span className="text-yellow-400 text-xs">⚠️ Expiry</span>}
                        {item.has_variants && <span className="text-purple-400 text-xs">🎨 Variants</span>}
                        {item.has_serial && <span className="text-blue-400 text-xs">📱 Serial</span>}
                      </div>
                    </div>
                    <button onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-300 text-sm ml-2">❌</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs">Qty ({item.unit_type})</label>
                      <input type="number" value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Buy Rs.</label>
                      <input type="number" value={item.buy_price}
                        onChange={(e) => updateItem(index, "buy_price", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Sell Rs.</label>
                      <input type="number" value={item.sell_price}
                        onChange={(e) => updateItem(index, "sell_price", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  {/* Batch + Expiry */}
<div className="mt-2">
  <div className={`grid gap-2 ${item.has_expiry ? "grid-cols-2" : "grid-cols-1"}`}>
    <div>
      <label className="text-slate-500 text-xs">Batch No</label>
      <input type="text" placeholder="BAT-2026-0001"
        value={item.batch_number || ""}
        onChange={(e) => updateItem(index, "batch_number", e.target.value)}
        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none mt-1"
      />
    </div>
    {item.has_expiry && (
      <div>
        <label className="text-slate-500 text-xs">Expiry Date</label>
        <input type="date" value={item.expiry_date || ""}
          onChange={(e) => updateItem(index, "expiry_date", e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-900 border border-yellow-500/30 rounded-lg text-white text-xs focus:outline-none mt-1"
        />
      </div>
    )}
  </div>
</div>
                  <div className="text-right mt-2">
                    <span className="text-blue-400 text-sm font-semibold">
                      Rs. {(item.buy_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">
                  Rs. {items.reduce((s, i) => s + i.buy_price * i.quantity, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Discount (Rs.)</span>
                <input type="number" value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm text-right focus:outline-none"
                />
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2">
                <span className="text-white">Total</span>
                <span className="text-blue-400 text-lg">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment */}
          {items.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-3">Payment</h3>
              <div className="flex gap-2 mb-3">
                {["cash", "check", "credit"].map(type => (
                  <button key={type}
                    onClick={() => handlePaymentTypeChange(type)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      paymentType === type
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}>
                    {type === "cash" ? "💵 Cash" : type === "check" ? "📝 Check" : "💳 Credit"}
                  </button>
                ))}
              </div>

              {paymentType !== "credit" && (
                <div className="mb-3">
                  <label className="text-slate-400 text-xs mb-1 block">Paid Amount (Rs.)</label>
                  <input type="number" placeholder={totalAmount.toString()}
                    value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
              )}

              {paymentType === "check" && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Check No (auto)</label>
                    <input type="text" value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Check Date</label>
                    <input type="date" value={checkDate}
                      onChange={(e) => setCheckDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentType === "credit" && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 mb-3">
                  <p className="text-orange-400 text-sm font-medium">
                    Full amount on credit: Rs. {totalAmount.toLocaleString()}
                  </p>
                  <p className="text-orange-400/70 text-xs mt-1">
                    Will be added to supplier outstanding balance
                  </p>
                </div>
              )}

              {outstanding > 0 && paymentType !== "credit" && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 mb-3">
                  <p className="text-orange-400 text-xs">
                    Outstanding: Rs. {outstanding.toLocaleString()} → Added to supplier credit
                  </p>
                </div>
              )}

              <input type="text" placeholder="Notes (optional)"
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none mb-3"
              />

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-40 text-sm">
                {loading ? "Saving..." : `Save GRN ✅ (Rs. ${totalAmount.toLocaleString()})`}
              </button>
            </div>
          )}
        </div>

        {/* Found Product Popup */}
        {showProductOptions && foundProduct && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-lg">📦</div>
                <div>
                  <h3 className="text-white font-bold text-sm">{foundProduct.name}</h3>
                  <p className="text-slate-500 text-xs">{foundProduct.product_code} | {foundProduct.barcode}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 mb-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-500 text-xs">Current Stock</p>
                  <p className="text-white text-sm font-bold">{foundProduct.stock} {foundProduct.unit_type}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Category</p>
                  <p className="text-slate-300 text-sm">{foundProduct.category || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Buy Price</p>
                  <p className="text-blue-400 text-sm font-bold">Rs. {foundProduct.buy_price}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Sell Price</p>
                  <p className="text-green-400 text-sm font-bold">Rs. {foundProduct.sell_price}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setItems([...items, {
                      product_id: foundProduct.id,
                      product_name: foundProduct.name,
                      barcode: foundProduct.barcode,
                      category: foundProduct.category,
                      quantity: 1,
                      buy_price: Number(foundProduct.buy_price),
                      sell_price: Number(foundProduct.sell_price),
                      unit_type: foundProduct.unit_type,
                      buy_unit: foundProduct.buy_unit || foundProduct.unit_type,
                      sell_unit: foundProduct.sell_unit || foundProduct.unit_type,
                      has_expiry: foundProduct.has_expiry,
                      has_variants: foundProduct.has_variants,
                      has_serial: foundProduct.has_serial,
                    }])
                    setShowProductOptions(false)
                    setFoundProduct(null)
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium">
                  ✅ Add (Buy: Rs.{foundProduct.buy_price} | Sell: Rs.{foundProduct.sell_price})
                </button>
                <button
                  onClick={() => {
                    setQuickAdd(q => ({
                      ...q,
                      product_name: foundProduct.name,
                      barcode: foundProduct.barcode || "",
                      category: foundProduct.category || "",
                      buy_price: foundProduct.buy_price.toString(),
                      sell_price: foundProduct.sell_price.toString(),
                      print_price: foundProduct.print_price?.toString() || "",
                      buy_unit: foundProduct.buy_unit || foundProduct.unit_type,
                      sell_unit: foundProduct.sell_unit || foundProduct.unit_type,
                      conversion_rate: foundProduct.conversion_rate?.toString() || "1",
                      has_expiry: foundProduct.has_expiry,
                      has_variants: foundProduct.has_variants,
                      has_serial: foundProduct.has_serial,
                      batch_number: foundProduct.has_expiry ? getNextBatchNumber() : "",
                      quantity: "1",
                    }))
                    setShowProductOptions(false)
                    setFoundProduct(null)
                    setShowQuickAdd(true)
                  }}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-medium">
                  🔄 New Batch / Change Price
                </button>
                <button
                  onClick={() => { setShowProductOptions(false); setFoundProduct(null) }}
                  className="w-full py-2 border border-slate-600 text-slate-400 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Popup */}
        {showQuickAdd && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-white font-bold mb-4">➕ Add New Product</h3>
              <div className="flex flex-col gap-3">

                {/* Name */}
                <input type="text" placeholder="Product Name *"
                  value={quickAdd.product_name}
                  onChange={(e) => setQuickAdd({ ...quickAdd, product_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />

                {/* Barcode + Part No */}
                {["bike", "auto", "hardware", "electronics", "phone"].includes(businessType) ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Barcode"
                      value={quickAdd.barcode}
                      onChange={(e) => setQuickAdd({ ...quickAdd, barcode: e.target.value })}
                      className="px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                    />
                    <input type="text" placeholder="Part No (optional)"
                      value={quickAdd.part_number}
                      onChange={(e) => setQuickAdd({ ...quickAdd, part_number: e.target.value })}
                      className="px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>
                ) : (
                  <input type="text" placeholder="Barcode (optional)"
                    value={quickAdd.barcode}
                    onChange={(e) => setQuickAdd({ ...quickAdd, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                  />
                )}

                {/* Category */}
                <select value={quickAdd.category}
                  onChange={(e) => setQuickAdd({ ...quickAdd, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
                  <option value="">Select category</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">+ Add New Category</option>
                </select>
                {quickAdd.category === "__custom__" && (
                  <input type="text" placeholder="Type new category name" autoFocus
                    onChange={(e) => setQuickAdd({ ...quickAdd, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-blue-500/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                  />
                )}

                {/* Pricing */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-2">💰 Pricing</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs">Buy Rs.</label>
                      <input type="number" placeholder="0"
                        value={quickAdd.buy_price}
                        onChange={(e) => setQuickAdd({ ...quickAdd, buy_price: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Sell Rs. *</label>
                      <input type="number" placeholder="0"
                        value={quickAdd.sell_price}
                        onChange={(e) => setQuickAdd({ ...quickAdd, sell_price: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Print Rs.</label>
                      <input type="number" placeholder="0"
                        value={quickAdd.print_price}
                        onChange={(e) => setQuickAdd({ ...quickAdd, print_price: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                  </div>
                  {quickAdd.buy_price && quickAdd.sell_price && Number(quickAdd.buy_price) > 0 && (
                    <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                      <p className="text-green-400 text-xs">
                        Profit: Rs. {(Number(quickAdd.sell_price) - Number(quickAdd.buy_price)).toFixed(2)}
                        {" "}({(((Number(quickAdd.sell_price) - Number(quickAdd.buy_price)) / Number(quickAdd.buy_price)) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </div>

                {/* Units + Stock */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-2">📦 Stock & Units</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-slate-500 text-xs">Buy Unit</label>
                      <select value={quickAdd.buy_unit}
                        onChange={(e) => setQuickAdd({ ...quickAdd, buy_unit: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1">
                        {buyUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Sell Unit</label>
                      <select value={quickAdd.sell_unit}
                        onChange={(e) => setQuickAdd({ ...quickAdd, sell_unit: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1">
                        {sellUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Conversion */}
                  {quickAdd.buy_unit !== quickAdd.sell_unit && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs">1 {quickAdd.buy_unit} =</span>
                        <input type="number" value={quickAdd.conversion_rate}
                          onChange={(e) => setQuickAdd({ ...quickAdd, conversion_rate: e.target.value })}
                          className="w-16 px-2 py-1 bg-slate-900 border border-blue-500/50 rounded-lg text-white text-xs text-center focus:outline-none"
                        />
                        <span className="text-white text-xs">{quickAdd.sell_unit}</span>
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {[6, 10, 12, 24, 25, 48, 100].map(n => (
                          <button key={n}
                            onClick={() => setQuickAdd({ ...quickAdd, conversion_rate: n.toString() })}
                            className={`px-2 py-0.5 rounded text-xs ${
                              quickAdd.conversion_rate === n.toString()
                                ? "bg-blue-600 text-white"
                                : "bg-slate-700 text-slate-400"
                            }`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs">Qty ({quickAdd.buy_unit})</label>
                      <input type="number" placeholder="0"
                        value={quickAdd.quantity}
                        onChange={(e) => setQuickAdd({ ...quickAdd, quantity: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Min Stock</label>
                      <input type="number" placeholder="0"
                        value={quickAdd.min_stock}
                        onChange={(e) => setQuickAdd({ ...quickAdd, min_stock: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs">Alert Level</label>
                      <input type="number" placeholder="5"
                        value={quickAdd.low_stock_alert}
                        onChange={(e) => setQuickAdd({ ...quickAdd, low_stock_alert: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-orange-500/30 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                  </div>

                  {quickAdd.quantity && Number(quickAdd.quantity) > 0 && (
                    <div className="mt-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
                      <p className="text-slate-400 text-xs">
                        Actual stock: <span className="text-white font-medium">
                          {Number(quickAdd.quantity) * Number(quickAdd.conversion_rate || 1)} {quickAdd.sell_unit}
                        </span>
                        {quickAdd.buy_unit !== quickAdd.sell_unit && (
                          <span className="text-slate-500">
                            {" "}({quickAdd.quantity} {quickAdd.buy_unit} × {quickAdd.conversion_rate})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Product Settings */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-2">⚙️ Product Settings</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: "has_expiry", label: "⚠️ Has Expiry Date", color: "accent-yellow-500" },
                      { key: "has_variants", label: "🎨 Has Variants (Size/Color)", color: "accent-purple-500" },
                      { key: "has_serial", label: "📱 Has Serial/IMEI", color: "accent-blue-500" },
                      { key: "is_returnable", label: "↩️ Returnable", color: "accent-green-500" },
                    ].map((toggle) => (
                      <label key={toggle.key} className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-400 text-sm">{toggle.label}</span>
                        <input type="checkbox"
                          checked={(quickAdd as any)[toggle.key]}
                          onChange={(e) => setQuickAdd({ ...quickAdd, [toggle.key]: e.target.checked })}
                          className={`w-4 h-4 ${toggle.color}`}
                        />
                      </label>
                    ))}
                  </div>
                  {quickAdd.is_returnable && (
                    <div className="mt-2">
                      <label className="text-slate-500 text-xs">Return Days</label>
                      <input type="number" placeholder="7"
                        value={quickAdd.return_days}
                        onChange={(e) => setQuickAdd({ ...quickAdd, return_days: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Batch Details — Always show batch number */}
<div className={`rounded-xl p-3 border ${
  quickAdd.has_expiry
    ? "bg-slate-900/50 border-yellow-500/30"
    : "bg-slate-900/50 border-slate-700"
}`}>
  <p className={`text-xs mb-2 ${quickAdd.has_expiry ? "text-yellow-400" : "text-slate-400"}`}>
    🏷️ Batch {quickAdd.has_expiry ? "& Expiry" : "Number"}
  </p>
  <div className="flex gap-2 mb-2">
    <input type="text" placeholder="Batch Number (optional)"
      value={quickAdd.batch_number}
      onChange={(e) => setQuickAdd({ ...quickAdd, batch_number: e.target.value })}
      className={`flex-1 px-3 py-2 bg-slate-800 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none border ${
        quickAdd.has_expiry ? "border-yellow-500/30" : "border-slate-600/50"
      }`}
    />
    <button
      onClick={() => setQuickAdd({ ...quickAdd, batch_number: getNextBatchNumber() })}
      className="px-3 py-2 bg-slate-700 border border-slate-600 text-slate-400 hover:text-white rounded-lg text-xs">
      🔄 Auto
    </button>
  </div>

  {/* Expiry date — only if has_expiry */}
  {quickAdd.has_expiry && (
    <input type="date" value={quickAdd.expiry_date}
      onChange={(e) => setQuickAdd({ ...quickAdd, expiry_date: e.target.value })}
      className="w-full px-3 py-2 bg-slate-800 border border-yellow-500/30 rounded-lg text-white text-sm focus:outline-none"
    />
  )}
</div>

                {/* Variants */}
                {quickAdd.has_variants && (
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-3">
                    <p className="text-purple-400 text-xs mb-2">🎨 Variants</p>
                    {quickAdd.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                        <input type="text" placeholder="Color"
                          value={v.color}
                          onChange={(e) => {
                            const updated = [...quickAdd.variants]
                            updated[i] = { ...updated[i], color: e.target.value }
                            setQuickAdd({ ...quickAdd, variants: updated })
                          }}
                          className="px-2 py-1.5 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                        />
                        <input type="text" placeholder="Size (M/L/XL)"
                          value={v.size}
                          onChange={(e) => {
                            const updated = [...quickAdd.variants]
                            updated[i] = { ...updated[i], size: e.target.value }
                            setQuickAdd({ ...quickAdd, variants: updated })
                          }}
                          className="px-2 py-1.5 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                        />
                        <input type="number" placeholder="Stock"
                          value={v.stock}
                          onChange={(e) => {
                            const updated = [...quickAdd.variants]
                            updated[i] = { ...updated[i], stock: e.target.value }
                            setQuickAdd({ ...quickAdd, variants: updated })
                          }}
                          className="px-2 py-1.5 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                        />
                        <input type="text" placeholder="Barcode"
                          value={v.barcode}
                          onChange={(e) => {
                            const updated = [...quickAdd.variants]
                            updated[i] = { ...updated[i], barcode: e.target.value }
                            setQuickAdd({ ...quickAdd, variants: updated })
                          }}
                          className="px-2 py-1.5 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-xs"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setQuickAdd({
                        ...quickAdd,
                        variants: [...quickAdd.variants, { color: "", size: "", stock: "", barcode: "" }]
                      })}
                      className="w-full py-1.5 border border-dashed border-purple-500/50 text-purple-400 text-xs rounded-lg">
                      + Add Variant
                    </button>
                  </div>
                )}

                {/* Notes */}
                <textarea placeholder="Notes (optional)"
                  value={quickAdd.notes}
                  onChange={(e) => setQuickAdd({ ...quickAdd, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none resize-none"
                />

                {/* Buttons */}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setShowQuickAdd(false)}
                    className="flex-1 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm">
                    Cancel
                  </button>
                  <button onClick={handleQuickAdd}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm">
                    Add to GRN ✅
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}