// eslint-disable-next-line import/no-extraneous-dependencies
import { createGlobalState } from "react-hooks-global-state" // TODO_AB

import decodeJWT from "../utils/decodeJWT"

const anonymous = { sub: "anonymous", permissions: {} }
let token // TODO_AB
if (typeof window !== "undefined") {
  // Perform localStorage action
  token = sessionStorage.getItem("lba:token")
}

const { useGlobalState, getGlobalState } = createGlobalState({
  auth: token ? decodeJWT(token) : anonymous,
})

// subscribeToHttpEvent('http:error', (response) => {
//   if (response.status === 401) {
//     //Auto logout user when token is invalid
//     sessionStorage.removeItem('matcha:token')
//     setGlobalState('auth', anonymous)
//   }
// })

export const getAuth = () => getGlobalState("auth")
export const useAuthState = () => useGlobalState("auth")
export { anonymous }
