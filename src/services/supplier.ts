import api from "./api"

export const getSuppliersApi = async () => {
  const res = await api.get("/suppliers")
  return res.data.data
}

export const addSupplierApi = async (data: {
  company_name: string
  contact_person?: string
  phone: string
  alt_phone?: string
  email?: string
  address?: string
  city?: string
  credit_limit?: number
  credit_days?: number
  notes?: string
}) => {
  const res = await api.post("/suppliers", data)
  return res.data.data
}

export const getSupplierByIdApi = async (id: number) => {
  const res = await api.get(`/suppliers/${id}`)
  return res.data.data
}