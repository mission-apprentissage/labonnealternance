import { useRouter } from "next/navigation"

import { UserContext } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../common/contants"

export const withAuth = (Component, scope = null) => {
  const Auth = (props) => {
    const router = useRouter()
    const { user } = useAuth()
    if (!user) {
      if (typeof window !== "undefined") {
        router.push("/espace-pro/authentification")
      }
      return <></>
    }

    if (scope && scope === "admin" && user.type !== AUTHTYPE.ADMIN) {
      if (typeof window !== "undefined") {
        router.push("/espace-pro/authentification")
      }
      return <></>
    }

    return <Component {...props} />
  }

  return Auth
}

export const authProvider = (Component) => {
  const Wrapper = (props) => {
    const { user, userAccess } = props
    return (
      <UserContext.Provider value={{ user, access: userAccess }}>
        <Component {...props} />
      </UserContext.Provider>
    )
  }

  return Wrapper
}
