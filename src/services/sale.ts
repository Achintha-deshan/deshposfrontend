import  api  from './api'

export const createSaleApi = async (data: {
  branch_id: number
  staff_id?: number
  items: any[]
  payment: {
    payment_type: string
    paid_amount: number
    discount: number
    customer_name?: string
    customer_phone?: string
    customer_id?: number
    is_credit?: boolean
    notes?: string
    payhere_order_id?: string
    payhere_status?: string
  }
}) => {
  const res = await api.post("/sales", data)
  return res.data.data
}

export const getSalesApi = async (limit?: number) => {
  const res = await api.get("/sales", {
    params: limit ? { limit } : {}
  })
  return res.data.data
}

export const getSaleDetailApi = async (id: number) => {
  const res = await api.get(`/sales/${id}`)
  return res.data.data
}

export const getDailySalesApi = async (date?: string) => {
  const res = await api.get("/sales/daily", {
    params: date ? { date } : {}
  })
  return res.data.data
}

export const getSaleByNumberApi = async (sale_number: string) => {
  const res = await api.get(`/sales/number/${sale_number}`)
  return res.data.data
}