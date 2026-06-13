import api from "./api"

export const getSuppliersApi = async () => {
  const res = await api.get("/purchase/suppliers")
  return res.data.data
}

export const getCheckNumberApi = async () => {
  const res = await api.get("/purchase/check-number")
  return res.data.data.check_number
}

export const getBatchNumberApi = async () => {
  const res = await api.get("/purchase/batch-number")
  return res.data.data.batch_number
}

export const createGRNApi = async (data: {
  branch_id: number
  supplier_id?: number | null
  items: any[]
  payment: {
    payment_type: string
    paid_amount: number
    discount: number
    check_number?: string
    check_date?: string
    notes?: string
  }
}) => {
  const res = await api.post("/purchase/grn", data)
  return res.data.data
}

export const getGRNListApi = async () => {
  const res = await api.get("/purchase/grn")
  return res.data.data
}

export const getGRNDetailsApi = async (id: number) => {
  const res = await api.get(`/purchase/grn/${id}`)
  return res.data.data
}