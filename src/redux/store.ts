import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice"
import productReducer from "./slices/productSlice"
import purchaseReducer from "./slices/purchaseSlice"
import cartReducer from "./slices/cartSlice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        purchase: purchaseReducer,
        cart: cartReducer,
        
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch