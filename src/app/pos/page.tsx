"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Receipt from "../../components/Receipt"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"
import {
  addToCart, updateQuantity, updateUnit,
  updateItemDiscount, updateUnitPrice,
  updateBatchNumber,
  removeFromCart, setCartDiscount,
  setPaymentType, setCustomerName, clearCart, updateDisplayQty
} from "../../redux/slices/cartSlice"
import { getProductByBarcode, searchProductsApi } from "../../services/product"
import { createSaleApi, getSaleByNumberApi } from "../../services/sale"
import api from "../../services/api"
import PrinterStatus from "../../components/PrinterStatus"
import {
  printReceipt, openCashDrawer,
  isBTConnected, isUSBConnected, autoReconnect
} from "../../utils/printer"

export default function POSPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const cart = useAppSelector(s => s.cart)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scanControlsRef = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const [branchId, setBranchId] = useState("")
  const [branches, setBranches] = useState<any[]>([])
  const [business, setBusiness] = useState<any>(null)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [paidAmount, setPaidAmount] = useState("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [billLanguage, setBillLanguage] = useState<"en" | "si">("en")
  const [batchSelectProduct, setBatchSelectProduct] = useState<any>(null)
  const [showBatchSelect, setShowBatchSelect] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isCreditSale, setIsCreditSale] = useState(false)
  const [showCustomerResults, setShowCustomerResults] = useState(false)

  // ✅ Live camera scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannerError, setScannerError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/business/me")
        setBusiness(res.data.data.business)
        setBranches(res.data.data.branches)
        const main = res.data.data.branches.find((b: any) => b.is_main)
        if (main) setBranchId(main.id.toString())
      } catch { router.push("/login") }
    }
    load()
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent))
    setTimeout(() => barcodeRef.current?.focus(), 100)
    autoReconnect().then(({ usb }) => {
      if (usb) showSuccess("🔌 Printer reconnected!")
    })
  }, [])

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (scanControlsRef.current) scanControlsRef.current.stop()
    }
  }, [])

  const refocus = useCallback(() => {
    setTimeout(() => barcodeRef.current?.focus(), 50)
  }, [])

  // ✅ Beep sound on successful scan (Web Audio API — works on every device, no file needed)
  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = "sine"
      oscillator.frequency.value = 1000
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.15)
    } catch {}
  }

  // ✅ Try to flash the camera torch briefly on successful scan (if device supports it)
  const flashTorch = async (stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0]
      const capabilities = (track.getCapabilities?.() as any) || {}
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: true } as any] })
        setTimeout(() => {
          track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {})
        }, 300)
      }
    } catch {}
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const qty = item.selected_unit === item.buy_unit
      ? item.quantity * item.conversion_rate : item.quantity
    return sum + (item.unit_price * qty) - item.discount
  }, 0)
  const total = subtotal - cart.cart_discount
  const change = Math.max(0, Number(paidAmount || 0) - total)

  const handleSearch = async (q: string) => {
    setBarcodeInput(q)
    setSelectedIndex(-1)
    if (q.length < 2) { setSearchResults([]); setShowSearch(false); return }
    try {
      const results = await searchProductsApi(q)
      setSearchResults(results)
      setShowSearch(results.length > 0)
    } catch { setSearchResults([]) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        addProductToCart(searchResults[selectedIndex])
        setBarcodeInput("")
        setShowSearch(false)
        setSelectedIndex(-1)
      } else {
        handleBarcodeSearch()
        setShowSearch(false)
      }
    } else if (e.key === "Escape") {
      setShowSearch(false)
      setBarcodeInput("")
    }
  }

  const handleBarcodeSearch = async (code?: string) => {
    const barcode = code || barcodeInput
    if (!barcode.trim()) return
    if (barcode.startsWith("SALE-")) {
      try {
        const data = await getSaleByNumberApi(barcode)
        setLastSale({
          ...data.sale, items: data.items,
          total: Number(data.sale.total_amount),
          change: Number(data.sale.change_amount),
          cart_discount: Number(data.sale.discount),
        })
        setShowReceipt(true)
      } catch { showError("Bill not found!") }
      setBarcodeInput("")
      return
    }
    try {
      const product = await getProductByBarcode(barcode)
      addProductToCart(product)
      setBarcodeInput("")
      setShowSearch(false)
    } catch { showError("Product not found!") }
  }

  const showError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(""), 2500)
    refocus()
  }

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 1500)
  }

  const handleCustomerSearch = async (q: string) => {
    setCustomerSearch(q)
    setSelectedCustomer(null)
    setIsCreditSale(false)
    dispatch(setCustomerName(q))
    if (q.length < 2) { setCustomerResults([]); setShowCustomerResults(false); return }
    try {
      const res = await api.get(`/customers/search?q=${encodeURIComponent(q)}`)
      setCustomerResults(res.data.data || [])
      setShowCustomerResults(true)
    } catch { setCustomerResults([]) }
  }

  const selectCustomer = (c: any) => {
    setSelectedCustomer(c)
    setCustomerSearch(c.name)
    setCustomerResults([])
    setShowCustomerResults(false)
    dispatch(setCustomerName(c.name))
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerSearch("")
    setIsCreditSale(false)
    dispatch(setCustomerName(""))
    refocus()
  }

  const addProductToCart = (product: any) => {
    if (Number(product.stock) <= 0) {
      showError(`Out of stock! ${product.name}`)
      return
    }
    if (product.batches && product.batches.length > 0) {
      setBatchSelectProduct(product)
      setShowBatchSelect(true)
      return
    }
    dispatchAddToCart(product, null)
  }

  const dispatchAddToCart = (product: any, batch: any) => {
    dispatch(addToCart({
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode,
      category: product.category,
      unit_price: Number(batch?.sell_price || product.sell_price),
      buy_price: Number(batch?.buy_price || product.buy_price),
      print_price: Number(product.print_price) || 0,
      sell_unit: product.sell_unit || product.unit_type,
      buy_unit: product.buy_unit || product.unit_type,
      conversion_rate: Number(product.conversion_rate) || 1,
      selected_unit: product.sell_unit || product.unit_type,
      quantity: 1,
      discount: 0,
      unit_type: product.unit_type,
      batch_number: batch?.batch_number || "",
      has_serial: product.has_serial,
      stock: Number(batch?.quantity || product.stock),
    }))
    showSuccess(`✅ ${product.name}${batch ? ` [${batch.batch_number}]` : ""} added!`)
    refocus()
  }

  const addWithBatch = (batch: any) => {
    dispatchAddToCart(batchSelectProduct, batch)
    setShowBatchSelect(false)
    setBatchSelectProduct(null)
  }

  // ✅ Live camera scanner — opens a small box with a real-time video feed (works on any device: mobile/tablet/desktop)
  const startCameraScan = async () => {
    setScannerError("")
    setShowScanner(true)
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const reader = new BrowserMultiFormatReader()
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear")
      ) || devices[devices.length - 1]

      const controls = await reader.decodeFromVideoDevice(
        backCamera?.deviceId, videoRef.current!,
        (result) => {
          if (result) {
            const code = result.getText()
            playBeep()
            setScanSuccess(true)

            const stream = videoRef.current?.srcObject as MediaStream
            if (stream) flashTorch(stream)

            setTimeout(() => {
              controls.stop()
              setShowScanner(false)
              setScanSuccess(false)
              handleBarcodeSearch(code)
            }, 350)
          }
        }
      )
      scanControlsRef.current = controls
    } catch {
      setScannerError("Camera access failed! Make sure you're using HTTPS and have granted camera permission.")
    }
  }

  const stopCameraScan = () => {
    if (scanControlsRef.current) {
      scanControlsRef.current.stop()
      scanControlsRef.current = null
    }
    setShowScanner(false)
    setScanSuccess(false)
    refocus()
  }

  const handleSubmit = async () => {
    if (cart.items.length === 0) return showError("Add products first!")
    if (isCreditSale && !selectedCustomer) return showError("Select customer for credit sale!")
    if (!isCreditSale) {
      if (cart.payment_type === "cash" && !paidAmount) return showError("Enter paid amount!")
      if (cart.payment_type === "cash" && Number(paidAmount) < total) return showError("Insufficient amount!")
    }
    try {
      setLoading(true)
      setError("")
      const items = cart.items.map(item => {
        const actualQty = item.selected_unit === item.buy_unit
          ? item.quantity * item.conversion_rate : item.quantity
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          barcode: item.barcode,
          category: item.category,
          quantity: actualQty,
          selected_unit: item.selected_unit,
          buy_unit: item.buy_unit,
          sell_unit: item.sell_unit,
          conversion_rate: item.conversion_rate,
          unit_price: item.unit_price,
          buy_price: item.buy_price,
          print_price: item.print_price,
          discount: item.discount,
          unit_type: item.unit_type,
          batch_number: item.batch_number,
          has_serial: item.has_serial,
        }
      })

      const data = await createSaleApi({
        branch_id: Number(branchId),
        items,
        payment: {
          payment_type: isCreditSale ? "credit" : cart.payment_type,
          paid_amount: isCreditSale ? 0 : cart.payment_type === "cash" ? Number(paidAmount) : total,
          discount: cart.cart_discount,
          customer_name: cart.customer_name || undefined,
          customer_id: selectedCustomer?.id || undefined,
          is_credit: isCreditSale,
        },
      })

      const cartItemsCopy = [...cart.items]
      const totalCopy = total
      const changeCopy = isCreditSale ? 0 : change
      const saleData = {
        ...data,
        items: cartItemsCopy,
        total: totalCopy,
        change: changeCopy,
        cart_discount: cart.cart_discount,
        customer_name: cart.customer_name,
        created_at: new Date().toISOString(),
      }

      if (isCreditSale && selectedCustomer) {
        try {
          await api.post(`/customers/${selectedCustomer.id}/sale`, {
            sale_id: data.sale_id,
            total_amount: totalCopy,
            paid_amount: 0,
            payment_type: "credit",
            description: `Credit sale: ${data.sale_number}`,
          })
        } catch (e) { console.error(e) }
      }

      setLastSale(saleData)
      setShowReceipt(true)
      dispatch(clearCart())
      setPaidAmount("")
      setIsCreditSale(false)
      setSelectedCustomer(null)
      setCustomerSearch("")

      if (isBTConnected() || isUSBConnected()) {
        try {
          await printReceipt(saleData, cartItemsCopy, business, billLanguage, changeCopy)
          await openCashDrawer()
          showSuccess("🖨️ Printed!")
        } catch { showError("Print failed! Use Print button.") }
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed!")
    } finally {
      setLoading(false)
    }
  }

  return (
    // ✅ Responsive root: column layout on small screens, row on large screens (handled below)
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">

      {/* Top Bar — ✅ wraps on small screens */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2 flex-wrap flex-shrink-0">
        <button onClick={() => router.push("/dashboard")}
          className="text-slate-500 hover:text-white text-sm p-1">←</button>
        <h1 className="text-white font-bold text-base">🛒 POS</h1>

        {branches.length > 1 && (
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none">
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>📍 {b.name}</option>
            ))}
          </select>
        )}

        <div className="flex-1 hidden sm:block" />
        <PrinterStatus />

        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <button onClick={() => setBillLanguage("en")}
            className={`px-2 py-1 text-xs font-medium transition ${billLanguage === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
            EN
          </button>
          <button onClick={() => setBillLanguage("si")}
            className={`px-2 py-1 text-xs font-medium transition ${billLanguage === "si" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
            සිං
          </button>
        </div>

        {success && (
          <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-lg animate-pulse">
            {success}
          </span>
        )}
        <span className="text-slate-500 text-xs">{cart.items.length} items</span>
        {cart.items.length > 0 && (
          <button onClick={() => { dispatch(clearCart()); refocus() }}
            className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
            🗑
          </button>
        )}
      </div>

      {/* Main Layout — ✅ stacks vertically on small/medium screens, side-by-side on large screens */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">

          {/* Scan Input */}
          <div className="bg-slate-900 border-b border-slate-800 p-2 flex-shrink-0">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-1.5 mb-2">
                ⚠️ {error}
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1 relative min-w-0">
                <input
                  ref={barcodeRef}
                  type="text"
                  placeholder="🔍 Scan barcode or type product name..."
                  value={barcodeInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                  onFocus={() => barcodeInput.length > 1 && setShowSearch(searchResults.length > 0)}
                  className="w-full px-4 py-2.5 bg-slate-800 border-2 border-blue-500/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus autoComplete="off"
                />
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-xl mt-1 z-50 shadow-2xl overflow-hidden">
                    {searchResults.map((p: any, idx: number) => (
                      <button key={p.id}
                        onMouseDown={() => { addProductToCart(p); setBarcodeInput(""); setShowSearch(false) }}
                        className={`w-full px-3 py-2.5 text-left border-b border-slate-700/50 last:border-0 transition-colors ${selectedIndex === idx ? "bg-blue-600" : "hover:bg-slate-700"}`}>
                        <div className="flex justify-between items-center">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{p.name}</p>
                            <p className="text-slate-400 text-xs">{p.product_code} {p.barcode ? `· ${p.barcode}` : ""}</p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="text-green-400 text-sm font-bold">Rs.{p.sell_price}</p>
                            <p className={`text-xs ${Number(p.stock) <= 0 ? "text-red-400" : "text-slate-400"}`}>
                              {p.stock} {p.unit_type}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* ✅ Opens the live camera scanner box — works on mobile, tablet, and desktop (webcam) */}
              <button onClick={startCameraScan}
                className="px-3 py-2.5 rounded-xl text-sm font-medium transition flex-shrink-0 bg-purple-600 hover:bg-purple-500 text-white">
                📷
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2" onClick={refocus}>
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-5xl mb-3 opacity-30">🛒</p>
                <p className="text-slate-600 text-sm">Scan or search to add products</p>
                <button onClick={startCameraScan}
                  className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium">
                  📷 Open Camera
                </button>
              </div>
            ) : (
              cart.items.map((item, index) => {
                const actualQty = item.selected_unit === item.buy_unit
                  ? item.quantity * item.conversion_rate : item.quantity
                const itemTotal = (item.unit_price * actualQty) - item.discount
                const stockLow = item.stock !== undefined && item.stock <= 5
                const stockOut = item.stock !== undefined && item.stock <= 0

                return (
                  <div key={index}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-white text-sm font-semibold truncate">{item.product_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.barcode && <span className="text-slate-600 text-xs">{item.barcode}</span>}
                          {item.print_price > item.unit_price && (
                            <span className="text-slate-500 text-xs line-through">MRP Rs.{item.print_price}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => { dispatch(removeFromCart(index)); refocus() }}
                        className="text-slate-600 hover:text-red-400 text-xl leading-none px-1">×</button>
                    </div>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.stock !== undefined && (
                        <div className={`text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0 ${
                          stockOut ? "bg-red-500/20 text-red-400" :
                          stockLow ? "bg-orange-500/20 text-orange-400" :
                          "bg-green-500/10 text-green-400"
                        }`}>
                          {stockOut ? "❌" : stockLow ? "⚠️" : "✅"} {item.stock} {item.sell_unit}
                        </div>
                      )}
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="text-yellow-500 text-xs flex-shrink-0">🏷️</span>
                        <input
                          type="text"
                          placeholder="Batch No"
                          value={item.batch_number || ""}
                          onChange={(e) => dispatch(updateBatchNumber({ index, batch_number: e.target.value }))}
                          onBlur={refocus}
                          className="flex-1 min-w-0 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded-lg text-yellow-400 placeholder-slate-500 text-xs focus:outline-none focus:border-yellow-500/50"
                        />
                      </div>
                    </div>

                    {item.buy_unit !== item.sell_unit && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 text-xs">Unit:</span>
                        <select
                          value={item.selected_unit}
                          onChange={(e) => { dispatch(updateUnit({ index, selected_unit: e.target.value })); refocus() }}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs focus:outline-none">
                          <option value={item.sell_unit}>{item.sell_unit}</option>
                          <option value={item.buy_unit}>{item.buy_unit}</option>
                        </select>
                        <span className="text-blue-400/70 text-xs">
                          = {actualQty % 1 === 0 ? actualQty : actualQty.toFixed(2)} {item.sell_unit}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="text-slate-500 text-xs block mb-1">Quantity</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={item.displayQty ?? item.quantity}
                            onChange={(e) => {
                              const inputVal = Number(e.target.value)
                              const unit = item.displayUnit || item.selected_unit
                              const actualQty = (unit === "g" || unit === "ml") ? inputVal / 1000 : inputVal
                              if (actualQty > 0) {
                                dispatch(updateQuantity({ index, quantity: actualQty }))
                                dispatch(updateDisplayQty({ index, displayQty: inputVal, displayUnit: unit }))
                              }
                            }}
                            onBlur={refocus}
                            className="flex-1 min-w-0 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none"
                          />
                          {(item.selected_unit === "kg" || item.selected_unit === "litre") ? (
                            <select
                              value={item.displayUnit || item.selected_unit}
                              onChange={(e) => {
                                const newUnit = e.target.value
                                const newDisplayQty = (newUnit === "g" || newUnit === "ml")
                                  ? item.quantity * 1000
                                  : item.quantity
                                dispatch(updateDisplayQty({ index, displayQty: newDisplayQty, displayUnit: newUnit }))
                                refocus()
                              }}
                              className="px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs focus:outline-none flex-shrink-0">
                              <option value={item.selected_unit}>{item.selected_unit}</option>
                              <option value={item.selected_unit === "kg" ? "g" : "ml"}>
                                {item.selected_unit === "kg" ? "g" : "ml"}
                              </option>
                            </select>
                          ) : (
                            <span className="px-2 py-2 bg-slate-700/50 text-slate-400 text-xs rounded-lg flex-shrink-0 flex items-center">
                              {item.selected_unit}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 text-xs block mb-1">Price (Rs./{item.sell_unit})</label>
                        <div className="bg-slate-700 border border-blue-500/30 rounded-lg px-2 py-1.5">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => dispatch(updateUnitPrice({ index, unit_price: Number(e.target.value) }))}
                            onBlur={refocus}
                            className="w-full bg-transparent text-white text-sm text-center focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 text-xs block mb-1">Discount (Rs.)</label>
                        <div className="bg-slate-700 rounded-lg px-2 py-1.5">
                          <input
                            type="number"
                            value={item.discount || ""}
                            placeholder="0"
                            onChange={(e) => dispatch(updateItemDiscount({ index, discount: Number(e.target.value) }))}
                            onBlur={refocus}
                            className="w-full bg-transparent text-white text-sm text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                      <div className="text-slate-500 text-xs">
                        {item.quantity} × Rs.{item.unit_price}
                        {item.discount > 0 && <span className="text-red-400"> − Rs.{item.discount}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.print_price > item.unit_price && (
                          <span className="text-green-400 text-xs">
                            Save Rs.{((item.print_price - item.unit_price) * actualQty).toFixed(0)}
                          </span>
                        )}
                        <span className="text-blue-400 text-sm font-bold">Rs.{itemTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT — Payment Panel — ✅ full width on small screens, fixed width on large screens */}
        <div className="w-full lg:w-72 xl:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col flex-shrink-0 max-h-[55vh] lg:max-h-none overflow-y-auto lg:overflow-visible">

          {/* ✅ Customer Search */}
          <div className="px-3 pt-3 pb-2 border-b border-slate-800">
            <div className="relative">
              <input
                type="text"
                placeholder="👤 Search customer by name/phone..."
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onFocus={() => customerResults.length > 0 && setShowCustomerResults(true)}
                onBlur={() => setTimeout(() => setShowCustomerResults(false), 150)}
                className={`w-full px-3 py-2 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition ${
                  selectedCustomer
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-800 border-slate-700 focus:border-slate-500"
                }`}
              />
              {selectedCustomer && (
                <button
                  onClick={clearCustomer}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 text-lg">
                  ×
                </button>
              )}

              {showCustomerResults && customerResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-xl mt-1 z-50 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {customerResults.map((c: any) => (
                    <button key={c.id}
                      onMouseDown={() => selectCustomer(c)}
                      className="w-full px-3 py-2.5 text-left hover:bg-slate-700 border-b border-slate-700/50 last:border-0 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          {c.phone && <p className="text-slate-400 text-xs">{c.phone}</p>}
                        </div>
                        <div className="text-right ml-2">
                          {c.is_credit_customer && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded block mb-0.5">
                              💳 Credit
                            </span>
                          )}
                          {Number(c.outstanding_balance) > 0 && (
                            <p className="text-orange-400 text-xs">
                              Due: Rs.{Number(c.outstanding_balance).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-400 text-xs font-bold">✅ {selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-slate-500 text-xs">{selectedCustomer.phone}</p>
                    )}
                    {Number(selectedCustomer.outstanding_balance) > 0 && (
                      <p className="text-orange-400 text-xs">
                        Outstanding: Rs.{Number(selectedCustomer.outstanding_balance).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {selectedCustomer.is_credit_customer && (
                  <div
                    onClick={() => setIsCreditSale(!isCreditSale)}
                    className={`mt-2 flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition ${
                      isCreditSale
                        ? "bg-orange-500/20 border border-orange-500/30"
                        : "bg-slate-700/50 border border-slate-600"
                    }`}>
                    <div>
                      <p className={`text-xs font-bold ${isCreditSale ? "text-orange-400" : "text-slate-400"}`}>
                        📝 Naya Sale (Credit)
                      </p>
                      <p className="text-slate-500 text-xs">
                        {isCreditSale ? "Amount added to account" : "Tap to enable credit"}
                      </p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                      isCreditSale ? "bg-orange-500" : "bg-slate-600"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                        isCreditSale ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-3 py-2 border-b border-slate-800 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-slate-300">Rs.{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Discount</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs">Rs.</span>
                <input type="number" placeholder="0"
                  value={cart.cart_discount || ""}
                  onChange={(e) => dispatch(setCartDiscount(Number(e.target.value)))}
                  onBlur={refocus}
                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-right focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-white font-bold text-base">TOTAL</span>
              <span className="text-blue-400 text-2xl font-black">Rs.{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Type */}
          {!isCreditSale ? (
            <div className="px-3 py-2 border-b border-slate-800">
              <div className="flex gap-2 mb-2">
                {["cash", "card", "check"].map(type => (
                  <button key={type}
                    onClick={() => { dispatch(setPaymentType(type)); refocus() }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                      cart.payment_type === type
                        ? type === "cash" ? "bg-green-600 text-white"
                          : type === "card" ? "bg-blue-600 text-white"
                          : "bg-purple-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                    }`}>
                    {type === "cash" ? "💵 Cash" : type === "card" ? "💳 Card" : "📝 Check"}
                  </button>
                ))}
              </div>

              {cart.payment_type === "cash" && (
                <div>
                  <input type="number"
                    placeholder={`Enter amount (${total.toFixed(2)})`}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border-2 border-green-500/40 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-green-500"
                  />
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {[100, 200, 500, 1000, 2000, 5000].map(amt => (
                      <button key={amt}
                        onClick={() => { setPaidAmount(amt.toString()); refocus() }}
                        className="flex-1 min-w-0 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700">
                        {amt >= 1000 ? `${amt/1000}k` : amt}
                      </button>
                    ))}
                    <button
                      onClick={() => { setPaidAmount((Math.ceil(total / 100) * 100).toString()); refocus() }}
                      className="px-2 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs border border-blue-500/30">
                      ↑
                    </button>
                  </div>
                  {Number(paidAmount) >= total && total > 0 && (
                    <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 text-center">
                      <p className="text-slate-400 text-xs">Change</p>
                      <p className="text-green-400 text-2xl font-black">Rs.{change.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {cart.payment_type === "card" && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-slate-400 text-xs">Card Payment</p>
                  <p className="text-blue-400 text-xl font-bold">Rs.{total.toFixed(2)}</p>
                </div>
              )}

              {cart.payment_type === "check" && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-slate-400 text-xs">Check Payment</p>
                  <p className="text-purple-400 text-xl font-bold">Rs.{total.toFixed(2)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 border-b border-slate-800">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-3 text-center">
                <p className="text-orange-400 text-xs mb-1">📝 Credit Sale (නයට)</p>
                <p className="text-orange-400 text-2xl font-black">Rs.{total.toFixed(2)}</p>
                <p className="text-slate-500 text-xs mt-1">
                  Added to {selectedCustomer?.name}'s account
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="p-3 mt-auto">
            <button onClick={handleSubmit}
              disabled={loading || cart.items.length === 0}
              className={`w-full py-4 font-black rounded-xl transition text-lg ${
                cart.items.length === 0
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : loading
                    ? "bg-green-700 text-white animate-pulse"
                    : isCreditSale
                      ? "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                      : "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-lg shadow-green-900/30"
              }`}>
              {loading ? "⏳ Processing..." :
                isCreditSale
                  ? `📝 Naya Rs.${total.toFixed(2)}`
                  : `✅ Bill Rs.${total.toFixed(2)}`
              }
            </button>
            {cart.items.length > 0 && (
              <p className="text-center text-slate-600 text-xs mt-1">
                {cart.items.length} item{cart.items.length > 1 ? "s" : ""} · {cart.items.reduce((s, i) => s + i.quantity, 0)} qty
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Live Camera Scanner Box (responsive: works on mobile/tablet/desktop) */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 w-full max-w-xs sm:max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">📷 Scan Barcode</h3>
              <button onClick={stopCameraScan}
                className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`relative w-56 h-32 transition-all ${scanSuccess ? "scale-105" : ""}`}>
                  <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg ${scanSuccess ? "border-green-400" : "border-blue-400"}`} />
                  <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg ${scanSuccess ? "border-green-400" : "border-blue-400"}`} />
                  <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg ${scanSuccess ? "border-green-400" : "border-blue-400"}`} />
                  <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-lg ${scanSuccess ? "border-green-400" : "border-blue-400"}`} />
                  {!scanSuccess && (
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/70 animate-pulse" />
                  )}
                  {scanSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">✅</span>
                    </div>
                  )}
                </div>
              </div>

              {scanSuccess && (
                <div className="absolute inset-0 bg-green-400/20 animate-pulse" />
              )}
            </div>

            {scannerError ? (
              <p className="text-red-400 text-xs text-center mt-3">{scannerError}</p>
            ) : (
              <p className="text-slate-400 text-xs text-center mt-3">
                {scanSuccess ? "✅ Barcode detected!" : "Point camera at barcode — scans automatically"}
              </p>
            )}

            <button onClick={stopCameraScan}
              className="w-full mt-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <Receipt sale={lastSale} items={lastSale.items || []} business={business} language={billLanguage} />
            <div className="flex gap-2 p-3 border-t border-gray-200 no-print sticky bottom-0 bg-white">
              <button
                onClick={async () => {
                  if (isBTConnected() || isUSBConnected()) {
                    await printReceipt(lastSale, lastSale.items || [], business, billLanguage, lastSale.change || 0)
                    await openCashDrawer()
                  } else { window.print() }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm">
                🖨️ Print
              </button>
              <button
                onClick={() => { setShowReceipt(false); setLastSale(null); refocus() }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm">
                ✅ New Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Select Modal */}
      {showBatchSelect && batchSelectProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-sm">🏷️ Select Batch</h3>
                <p className="text-slate-400 text-xs mt-0.5 truncate">{batchSelectProduct.name}</p>
              </div>
              <button
                onClick={() => { setShowBatchSelect(false); setBatchSelectProduct(null); refocus() }}
                className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {batchSelectProduct.batches.map((batch: any) => {
                const isNear = batch.expiry_date &&
                  new Date(batch.expiry_date) > new Date() &&
                  new Date(batch.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                const isLowStock = Number(batch.quantity) <= 5

                return (
                  <button key={batch.id}
                    onClick={() => addWithBatch(batch)}
                    className={`p-3 rounded-xl border text-left transition active:scale-[0.98] ${
                      isNear
                        ? "border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10"
                        : "border-slate-600 bg-slate-900/60 hover:bg-slate-700/60"
                    }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-bold">{batch.batch_number}</p>
                        {batch.expiry_date && (
                          <p className={`text-xs mt-0.5 ${isNear ? "text-yellow-400" : "text-slate-500"}`}>
                            {isNear ? "⏰ " : "📅 "}Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-base font-black">
                          Rs.{Number(batch.sell_price || batchSelectProduct.sell_price).toFixed(2)}
                        </p>
                        <p className={`text-xs font-medium ${isLowStock ? "text-orange-400" : "text-slate-400"}`}>
                          {isLowStock ? "⚠️ " : ""}Stock: {Number(batch.quantity).toFixed(0)} {batchSelectProduct.unit_type}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                dispatchAddToCart(batchSelectProduct, null)
                setShowBatchSelect(false)
                setBatchSelectProduct(null)
              }}
              className="w-full mt-3 py-2.5 border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 rounded-xl text-xs transition">
              ➕ Add without batch selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}