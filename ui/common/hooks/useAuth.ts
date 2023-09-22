import decodeJWT from "../../utils/decodeJWT"
import { useAuthState, anonymous, IUserPublic } from "../auth"

export default function useAuth(): [IUserPublic, (t: string) => void] {
  const [auth, setAuth] = useAuthState()

  const setAuthFromToken = (token: string) => {
    if (!token) {
      sessionStorage.removeItem("lba:token")
      setAuth(anonymous)
    } else {
      sessionStorage.setItem("lba:token", token)
      setAuth(decodeJWT(token) as IUserPublic)
    }
  }

  return [auth, setAuthFromToken]
}
