import decodeJWT from "../../utils/decodeJWT"
import { useAuthState, anonymous } from "../auth"

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

  return [auth, setAuthFromToken]
}
