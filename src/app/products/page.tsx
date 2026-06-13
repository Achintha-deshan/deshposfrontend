"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProductsApi, getCategoriesApi, getAlertsApi, getProductBatchesApi, deleteBatchApi, updateBatchApi } from "../../services/product"

export default function ProductsPage() {
  const router = useRouter()

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expired: [], nearExpiry: [] })
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)
  const [batches, setBatches] = useState<Record<number, any[]>>({})
  const [batchLoading, setBatchLoading] = useState<number | null>(null)
  const [editingBatch, setEditingBatch] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats, alts] = await Promise.all([
          getProductsApi(),
          getCategoriesApi(),
          getAlertsApi(),
        ])
        setProducts(Array.isArray(prods) ? prods : [])
        setCategories(Array.isArray(cats) ? cats : [])
        setAlerts(alts || { lowStock: [], expired: [], nearExpiry: [] })
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.product_code?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !selectedCategory || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  const getStockColor = (product: any) => {
    if (product.stock <= 0) return "text-red-400"
    if (product.stock <= product.low_stock_alert) return "text-orange-400"
    return "text-green-400"
  }

  const getStockBg = (product: any) => {
    if (product.stock <= 0) return "bg-red-500/10 border-red-500/30"
    if (product.stock <= product.low_stock_alert) return "bg-orange-500/10 border-orange-500/30"
    return "bg-green-500/10 border-green-500/30"
  }

  const loadBatches = async (productId: number) => {
    if (batches[productId]) return
    setBatchLoading(productId)
    try {
      const data = await getProductBatchesApi(productId)
      setBatches(prev => ({ ...prev, [productId]: Array.isArray(data) ? data : [] }))
    } catch {}
    finally { setBatchLoading(null) }
  }

  const handleExpandProduct = async (productId: number) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null)
    } else {
      setExpandedProduct(productId)
      await loadBatches(productId)
    }
  }

  const handleDeleteBatch = async (batchId: number, productId: number) => {
    if (!confirm("Delete this batch?")) return
    try {
      await deleteBatchApi(batchId, productId)
      setBatches(prev => ({
        ...prev,
        [productId]: prev[productId].filter(b => b.id !== batchId)
      }))
      const prods = await getProductsApi()
      setProducts(Array.isArray(prods) ? prods : [])
    } catch { alert("Failed to delete!") }
  }

  const handleUpdateBatch = async (batchId: number, productId: number) => {
    if (!editingBatch) return
    try {
      await updateBatchApi(batchId, {
        quantity: Number(editingBatch.quantity),
        buy_price: Number(editingBatch.buy_price),
        sell_price: Number(editingBatch.sell_price),
        expiry_date: editingBatch.expiry_date || undefined,
      })
      setBatches(prev => ({
        ...prev,
        [productId]: prev[productId].map(b => b.id === batchId ? { ...b, ...editingBatch } : b)
      }))
      setEditingBatch(null)
    } catch { alert("Failed to update!") }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-white font-bold text-xl">Products</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/purchase/new")}
              className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-medium">
              + GRN
            </button>
            <button onClick={() => router.push("/products/add")}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium">
              + Add
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(alerts.lowStock?.length > 0 || alerts.expired?.length > 0 || alerts.nearExpiry?.length > 0) && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {alerts.lowStock?.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
                <p className="text-orange-400 text-xs">⚠️ {alerts.lowStock.length} Low Stock</p>
              </div>
            )}
            {alerts.expired?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                <p className="text-red-400 text-xs">🚨 {alerts.expired.length} Expired</p>
              </div>
            )}
            {alerts.nearExpiry?.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
                <p className="text-yellow-400 text-xs">⏰ {alerts.nearExpiry.length} Near Expiry</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{products.length}</p>
            <p className="text-slate-500 text-xs">Total</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
            <p className="text-orange-400 font-bold text-lg">{alerts.lowStock?.length || 0}</p>
            <p className="text-slate-500 text-xs">Low Stock</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-red-400 font-bold text-lg">{alerts.expired?.length || 0}</p>
            <p className="text-slate-500 text-xs">Expired</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-4">
          <input type="text"
            placeholder="🔍 Search name, barcode, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <select value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-3 bg-slate-800 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none">
            <option value="">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Products List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No products found</p>
            <button onClick={() => router.push("/products/add")}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
              + Add Product
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((product: any) => (
              <div key={product.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">

                {/* Product Row */}
                <div className="p-4">
                  <div className="flex items-start gap-3">

                    {/* Image */}
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{product.name}</p>
                      <div className="flex gap-2 flex-wrap mt-0.5">
                        <span className="text-slate-500 text-xs">{product.product_code}</span>
                        {product.barcode && <span className="text-slate-600 text-xs">· {product.barcode}</span>}
                        {product.category && <span className="text-slate-600 text-xs">· {product.category}</span>}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-blue-400 text-xs">Buy: Rs.{Number(product.buy_price).toFixed(2)}</span>
                        <span className="text-green-400 text-xs">Sell: Rs.{Number(product.sell_price).toFixed(2)}</span>
                        {Number(product.print_price) > 0 && (
                          <span className="text-slate-500 text-xs">MRP: Rs.{Number(product.print_price).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {product.has_expiry && <span className="text-xs bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">⚠️ Expiry</span>}
                        {product.has_variants && <span className="text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">🎨 Variants</span>}
                        {product.has_serial && <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">📱 Serial</span>}
                        {product.buy_unit !== product.sell_unit && (
                          <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                            1 {product.buy_unit} = {product.conversion_rate} {product.sell_unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock */}
                    <div className={`border rounded-xl px-3 py-2 text-center flex-shrink-0 ${getStockBg(product)}`}>
                      <p className={`font-bold text-sm ${getStockColor(product)}`}>
                        {Number(product.stock) % 1 === 0 ? Number(product.stock) : Number(product.stock).toFixed(2)}
                      </p>
                      <p className="text-slate-500 text-xs">{product.unit_type}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/products/add?barcode=${product.barcode || ""}`)}
                      className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                      + Stock
                    </button>
                    <button
                      onClick={() => router.push("/purchase/new")}
                      className="flex-1 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-xs">
                      + GRN
                    </button>
                   {/* ✅ Edit button */}
                    <button
                      onClick={() => router.push(`/products/edit/${product.id}`)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs">
                      ✏️
                    </button>
                    {/* ✅ Batches button — always show */}
                    <button
                      onClick={() => handleExpandProduct(product.id)}
                      className={`flex-1 py-1.5 border rounded-lg text-xs transition ${
                        expandedProduct === product.id
                          ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                          : "bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white"
                      }`}>
                      {batchLoading === product.id ? "..." :
                        expandedProduct === product.id ? "▲ Batches" : "▼ Batches"}
                    </button>
                  </div>
                </div>

                {/* ✅ Batches Panel */}
                {expandedProduct === product.id && (
                  <div className="border-t border-slate-700 bg-slate-900/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-xs font-medium">🏷️ Batches</p>
                      <button
                        onClick={() => router.push(`/products/add?barcode=${product.barcode || ""}`)}
                        className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                        + New Batch
                      </button>
                    </div>

                    {!batches[product.id] || batches[product.id].length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-3">No batches found</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {batches[product.id].map((batch: any) => {
                          const isEditing = editingBatch?.id === batch.id
                          const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date()
                          const isNearExpiry = batch.expiry_date &&
                            new Date(batch.expiry_date) > new Date() &&
                            new Date(batch.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                          return (
                            <div key={batch.id}
                              className={`rounded-xl border p-3 ${
                                isExpired ? "border-red-500/30 bg-red-500/5" :
                                isNearExpiry ? "border-yellow-500/30 bg-yellow-500/5" :
                                "border-slate-700 bg-slate-800/50"
                              }`}>

                              {isEditing ? (
                                <div className="flex flex-col gap-2">
                                  <p className="text-white text-xs font-medium">✏️ Edit: {batch.batch_number}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-slate-500 text-xs">Qty ({product.unit_type})</label>
                                      <input type="number"
                                        value={editingBatch.quantity}
                                        onChange={(e) => setEditingBatch({ ...editingBatch, quantity: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs focus:outline-none mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-slate-500 text-xs">Expiry Date</label>
                                      <input type="date"
                                        value={editingBatch.expiry_date?.split("T")[0] || ""}
                                        onChange={(e) => setEditingBatch({ ...editingBatch, expiry_date: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs focus:outline-none mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-slate-500 text-xs">Buy Price</label>
                                      <input type="number"
                                        value={editingBatch.buy_price}
                                        onChange={(e) => setEditingBatch({ ...editingBatch, buy_price: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs focus:outline-none mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-slate-500 text-xs">Sell Price</label>
                                      <input type="number"
                                        value={editingBatch.sell_price || ""}
                                        onChange={(e) => setEditingBatch({ ...editingBatch, sell_price: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs focus:outline-none mt-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <button onClick={() => setEditingBatch(null)}
                                      className="flex-1 py-1.5 border border-slate-600 text-slate-400 rounded-lg text-xs">
                                      Cancel
                                    </button>
                                    <button onClick={() => handleUpdateBatch(batch.id, product.id)}
                                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs">
                                      Save ✅
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white text-xs font-bold">{batch.batch_number}</p>
                                    <div className="flex gap-3 mt-0.5 flex-wrap">
                                      <span className="text-slate-400 text-xs">
                                        Qty: {Number(batch.quantity).toFixed(2)} {product.unit_type}
                                      </span>
                                      <span className="text-blue-400 text-xs">
                                        Buy: Rs.{Number(batch.buy_price).toFixed(2)}
                                      </span>
                                      {batch.sell_price && (
                                        <span className="text-green-400 text-xs">
                                          Sell: Rs.{Number(batch.sell_price).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    {batch.expiry_date && (
                                      <p className={`text-xs mt-0.5 ${
                                        isExpired ? "text-red-400" :
                                        isNearExpiry ? "text-yellow-400" : "text-slate-500"
                                      }`}>
                                        {isExpired ? "🚨 Expired: " : isNearExpiry ? "⏰ Expires: " : "📅 Exp: "}
                                        {new Date(batch.expiry_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setEditingBatch({
                                        id: batch.id,
                                        quantity: batch.quantity,
                                        buy_price: batch.buy_price,
                                        sell_price: batch.sell_price || "",
                                        expiry_date: batch.expiry_date,
                                      })}
                                      className="px-2 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBatch(batch.id, product.id)}
                                      className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs">
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}