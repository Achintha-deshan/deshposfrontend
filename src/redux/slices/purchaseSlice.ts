import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  getSuppliersApi,
  getGRNListApi,
  createGRNApi,
} from "../../services/purchase"

export const fetchSuppliers = createAsyncThunk(
  "purchase/fetchSuppliers",
  async () => {
    return await getSuppliersApi()
  }
)

export const fetchGRNList = createAsyncThunk(
  "purchase/fetchGRNList",
  async () => {
    return await getGRNListApi()
  }
)

export const submitGRN = createAsyncThunk(
  "purchase/submitGRN",
  async (data: any) => {
    return await createGRNApi(data)
  }
)

interface PurchaseState {
  suppliers: any[]
  grnList: any[]
  loading: boolean
  error: string | null
  lastGRN: any | null
}

const initialState: PurchaseState = {
  suppliers: [],
  grnList: [],
  loading: false,
  error: null,
  lastGRN: null,
}

const purchaseSlice = createSlice({
  name: "purchase",
  initialState,
  reducers: {
    clearLastGRN: (state) => {
      state.lastGRN = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSuppliers.fulfilled, (state, action) => {
      state.suppliers = action.payload
    })

    builder.addCase(fetchGRNList.fulfilled, (state, action) => {
      state.grnList = action.payload
    })

    builder
      .addCase(submitGRN.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitGRN.fulfilled, (state, action) => {
        state.loading = false
        state.lastGRN = action.payload
      })
      .addCase(submitGRN.rejected, (state) => {
        state.loading = false
        state.error = "Failed to create GRN"
      })
  },
})

export const { clearLastGRN, clearError } = purchaseSlice.actions
export default purchaseSlice.reducer