import { useRouter } from "next/router"

import { UserContext, useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../common/contants"

export const withAuth = (Component, scope = null) => {
  const Auth = (props) => {
    const router = useRouter()
    const { user } = useAuth()
    if (!user) {
      if (typeof window !== "undefined") {
        router.push("/")
      }
      return <></>
    }

    if (scope && scope === "adminLbaR" && user.type !== AUTHTYPE.ADMIN) {
      if (typeof window !== "undefined") {
        router.push("/")
      }
      return <></>
    }

    if (scope && scope === "adminRva" && user.type !== AUTHTYPE.ADMIN) {
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
    return (
      <UserContext initialUser={props.auth}>
        <Component {...props} />
      </UserContext>
    )
  }

  return Wrapper
}
