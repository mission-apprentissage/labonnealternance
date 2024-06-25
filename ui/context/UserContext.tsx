import { Spinner } from "@chakra-ui/react"
import React, { createContext, useContext, useEffect, useState } from "react"
import { ComputedUserAccess, IUserRecruteurPublic } from "shared"

import { emitter } from "@/common/utils/emitter"
import { apiGet } from "@/utils/api.utils"

interface IAuthContext {
  user?: IUserRecruteurPublic
  userAccess?: ComputedUserAccess
  setUser: (user?: IUserRecruteurPublic) => void
}

export const AuthContext = createContext<IAuthContext>({
  user: null,
  setUser: () => {},
})

export async function getSession(): Promise<IUserRecruteurPublic | undefined> {
  try {
    const session: IUserRecruteurPublic = await apiGet(`/auth/session`, {})
    return session
  } catch (error) {
    return null
  }
}

export async function getUserAccess() {
  try {
    const userAccess: ComputedUserAccess = await apiGet(`/auth/access`, {})
    return userAccess
  } catch (error) {
    return null
  }
}

export const UserContext = ({
  children,
  user: initialUser,
  userAccess: initialUserAccess,
}: Pick<IAuthContext, "user" | "userAccess"> & {
  children: React.ReactNode
}) => {
  const [user, setUser] = useState<IUserRecruteurPublic | null>(initialUser)
  const [userAccess, setUserAccess] = useState<ComputedUserAccess | null>(initialUserAccess)
  const [isLoading, setIsLoading] = useState(!initialUser)

  useEffect(() => {
    async function getUser() {
      const user = initialUser ?? (await getSession())
      const userAccess = await getUserAccess()
      setUser(user)
      setUserAccess(userAccess)
      setIsLoading(false)
    }
    if (!initialUser) {
      getUser()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // @ts-expect-error: TODO check return
  useEffect(() => {
    const handler = (response) => {
      if (response.status === 401) {
        //Auto logout user when token is invalid
        setUser(null)
        setUserAccess(null)
      }
    }
    emitter.on("http:error", handler)
    return () => emitter.removeListener("http:error", handler)
  }, [])

  if (isLoading) {
    return <Spinner />
  }

  return <AuthContext.Provider value={{ user, setUser, userAccess }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
