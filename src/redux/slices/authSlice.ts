import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: {
    id: number
    name: string
    email: string
    phone_number?: string
    roles: string[]
    approved: boolean
  } | null
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{
      accessToken: string
      refreshToken: string
    }>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem("ACCESS_TOKEN", action.payload.accessToken)
      localStorage.setItem("REFRESH_TOKEN", action.payload.refreshToken)
    },
    setUser: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      localStorage.removeItem("ACCESS_TOKEN")
      localStorage.removeItem("REFRESH_TOKEN")
    },
  },
})

export const { setTokens, setUser, logout } = authSlice.actions
export default authSlice.reducer