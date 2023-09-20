import { useAuthState, anonymous } from "../auth"
import decodeJWT from "../utils/decodeJWT"

export default function useAuth() {
  const [auth, setAuth] = useAuthState()

  const setAuthFromToken = (token) => {
    if (!token) {
      sessionStorage.removeItem("lba:token")
      setAuth(anonymous)
    } else {
      sessionStorage.setItem("lba:token", token)
      setAuth(decodeJWT(token))
    }
  }
  const isAuthenticated = () => auth?.sub !== anonymous.sub

  return [auth, setAuthFromToken, isAuthenticated]
}
