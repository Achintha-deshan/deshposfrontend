import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  getProductsApi,
  getProductByBarcode,
  getCategoriesApi,
  getAlertsApi,
} from "../../services/product"

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (branch_id?: number) => {
    return await getProductsApi(branch_id)
  }
)

export const fetchProductByBarcode = createAsyncThunk(
  "products/fetchByBarcode",
  async (barcode: string) => {
    return await getProductByBarcode(barcode)
  }
)

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async () => {
    return await getCategoriesApi()
  }
)

export const fetchAlerts = createAsyncThunk(
  "products/fetchAlerts",
  async () => {
    return await getAlertsApi()
  }
)

interface ProductState {
  items: any[]
  categories: string[]
  alerts: {
    lowStock: any[]
    expired: any[]
    nearExpiry: any[]
  }
  loading: boolean
  error: string | null
  scannedProduct: any | null
}

const initialState: ProductState = {
  items: [],
  categories: [],
  alerts: {
    lowStock: [],
    expired: [],
    nearExpiry: [],
  },
  loading: false,
  error: null,
  scannedProduct: null,
}

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setScannedProduct: (state, action: PayloadAction<any>) => {
      state.scannedProduct = action.payload
    },
    clearScannedProduct: (state) => {
      state.scannedProduct = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.loading = false
        state.error = "Failed to load products"
      })

    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload
    })

    builder.addCase(fetchAlerts.fulfilled, (state, action) => {
      state.alerts = action.payload
    })

    builder.addCase(fetchProductByBarcode.fulfilled, (state, action) => {
      state.scannedProduct = action.payload
    })
  },
})

export const { setScannedProduct, clearScannedProduct, clearError } = productSlice.actions
export default productSlice.reducer