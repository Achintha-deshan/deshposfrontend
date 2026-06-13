import api from "./api"

export const getProductByBarcode = async (barcode: string) => {
  const res = await api.get(`/products/barcode/${barcode}`)
  return res.data.data
}

export const searchProductsApi = async (query: string) => {
  const res = await api.get(`/products/search?q=${query}`)
  return res.data.data
}

export const getProductsApi = async (branch_id?: number) => {
  const res = await api.get("/products/list", {
    params: branch_id ? { branch_id } : {}
  })
  return res.data.data
}

export const getCategoriesApi = async () => {
  const res = await api.get("/products/categories")
  return res.data.data
}

export const getProductBatchesApi = async (product_id: number) => {
  const res = await api.get(`/products/${product_id}/batches`)
  return res.data.data
}

export const addProductApi = async (formData: FormData) => {
  const res = await api.post("/products/add", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })
  return res.data.data
}

export const updateBatchApi = async (
  batch_id: number,
  data: {
    quantity?: number
    buy_price?: number
    sell_price?: number
    expiry_date?: string
  }
) => {
  const res = await api.put(`/products/batches/${batch_id}`, data)
  return res.data.data
}

export const deleteBatchApi = async (
  batch_id: number,
  product_id: number
) => {
  const res = await api.delete(`/products/batches/${batch_id}`, {
    data: { product_id }
  })
  return res.data
}

export const getAlertsApi = async () => {
  const res = await api.get("/products/alerts")
  return res.data.data
}