import api from "./api"

export const getCustomersApi = async () => {
  const res = await api.get("/customers")
  return res.data.data
}

export const searchCustomersApi = async (query: string) => {
  const res = await api.get(`/customers/search?q=${query}`)
  return res.data.data
}

export const addCustomerApi = async (data: {
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  credit_limit?: number
  is_credit_customer?: boolean
  notes?: string
}) => {
  const res = await api.post("/customers", data)
  return res.data.data
}

export const getCustomerByIdApi = async (id: number) => {
  const res = await api.get(`/customers/${id}`)
  return res.data.data
}

export const getCustomerLedgerApi = async (id: number) => {
  const res = await api.get(`/customers/${id}/ledger`)
  return res.data.data
}

export const recordCustomerPaymentApi = async (id: number, paid_amount: number, description?: string) => {
  const res = await api.post(`/customers/${id}/payment`, { paid_amount, description })
  return res.data.data
}