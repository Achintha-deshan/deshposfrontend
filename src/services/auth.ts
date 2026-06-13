import api from "./api"

export const register = async(
    name:string,
    email: string,
    phone_number:string,
    password:string
) =>{
    const res = await api.post("/auth/register",{
        name,email,phone_number,password
    })
    return res.data
}

export const login = async(
    identifier:string,
    password:string
) =>{
    const res = await api.post("/auth/login",{
        identifier,
        password
    })
    return res.data
}

export const staffLogin = async (
  identifier: string,
  password: string
) => {
  const res = await api.post("/auth/staff-login", {
    identifier,
    password,
  })
  return res.data
}

export const getMe = async () => {
  const res = await api.get("/auth/me")
  return res.data
}