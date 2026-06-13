import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface CartItem {
  product_id?: number
  product_name: string
  barcode?: string
  category?: string
  unit_price: number
  buy_price: number
  print_price: number
  sell_unit: string
  buy_unit: string
  conversion_rate: number
  selected_unit: string
  quantity: number
  discount: number
  unit_type: string
  batch_number?: string
  has_serial?: boolean
  serial_number?: string
  stock?: number  // ✅ add
}

interface CartState {
  items: CartItem[]
  cart_discount: number
  payment_type: string
  customer_name: string
  customer_phone: string
  notes: string
}

const initialState: CartState = {
  items: [],
  cart_discount: 0,
  payment_type: "cash",
  customer_name: "",
  customer_phone: "",
  notes: "",
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {

    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        i => i.product_id === action.payload.product_id &&
             i.selected_unit === action.payload.selected_unit
      )
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
    },

    updateQuantity: (state, action: PayloadAction<{
      index: number
      quantity: number
    }>) => {
      const item = state.items[action.payload.index]
      if (item) item.quantity = action.payload.quantity
    },

    updateUnit: (state, action: PayloadAction<{
      index: number
      selected_unit: string
    }>) => {
      const item = state.items[action.payload.index]
      if (item) item.selected_unit = action.payload.selected_unit
    },

    updateItemDiscount: (state, action: PayloadAction<{
      index: number
      discount: number
    }>) => {
      const item = state.items[action.payload.index]
      if (item) item.discount = action.payload.discount
    },

    updateUnitPrice: (state, action: PayloadAction<{
      index: number
      unit_price: number
    }>) => {
      const item = state.items[action.payload.index]
      if (item) item.unit_price = action.payload.unit_price
    },

    // ✅ NEW
    updateBatchNumber: (state, action: PayloadAction<{
      index: number
      batch_number: string
    }>) => {
      const item = state.items[action.payload.index]
      if (item) item.batch_number = action.payload.batch_number
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((_, i) => i !== action.payload)
    },

    setCartDiscount: (state, action: PayloadAction<number>) => {
      state.cart_discount = action.payload
    },

    setPaymentType: (state, action: PayloadAction<string>) => {
      state.payment_type = action.payload
    },

    setCustomerName: (state, action: PayloadAction<string>) => {
      state.customer_name = action.payload
    },

    setCustomerPhone: (state, action: PayloadAction<string>) => {
      state.customer_phone = action.payload
    },

    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload
    },

    clearCart: (state) => {
      state.items = []
      state.cart_discount = 0
      state.payment_type = "cash"
      state.customer_name = ""
      state.customer_phone = ""
      state.notes = ""
    },
  },
})

export const {
  addToCart,
  updateQuantity,
  updateUnit,
  updateItemDiscount,
  updateUnitPrice,
  updateBatchNumber,  // ✅ export
  removeFromCart,
  setCartDiscount,
  setPaymentType,
  setCustomerName,
  setCustomerPhone,
  setNotes,
  clearCart,
} = cartSlice.actions

export default cartSlice.reducer