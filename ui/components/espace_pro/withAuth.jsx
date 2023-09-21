import { useRouter } from "next/router"

import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { isUserAdmin } from "../../common/utils/rolesUtils"

const withAuth = (Component, scope = null) => {
  const Auth = (props) => {
    const router = useRouter()
    let [auth] = useAuth()

    if (auth.sub === "anonymous") {
      if (typeof window !== "undefined") {
        router.push("/")
      }
      return <></>
    }

    if (scope && scope === "adminLbaR" && auth.type !== AUTHTYPE.ADMIN) {
      if (typeof window !== "undefined") {
        router.push("/")
      }
      return <></>
    }

    if (scope && scope === "adminRva" && !isUserAdmin(auth)) {
      if (typeof window !== "undefined") {
        router.push("/espace-pro/admin/login")
      }
      return <></>
    }

    return <Component {...props} />
  }

  return Auth
}

export default withAuth
