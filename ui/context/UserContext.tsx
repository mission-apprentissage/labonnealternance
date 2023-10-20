import { Spinner } from "@chakra-ui/react"
import React, { useState, useEffect, createContext, FC, PropsWithChildren, useContext } from "react"
import { IUserRecruteurPublic } from "shared"

import { emitter } from "@/common/utils/emitter"
import { apiGet } from "@/utils/api.utils"

interface IAuthContext {
  user?: IUserRecruteurPublic
  setUser: (user?: IUserRecruteurPublic) => void
}

export const AuthContext = createContext<IAuthContext>({
  user: null,
  setUser: () => {},
})

interface Props extends PropsWithChildren {
  initialUser?: IUserRecruteurPublic
}

export async function getSession(): Promise<IUserRecruteurPublic | undefined> {
  try {
    const session: IUserRecruteurPublic = await apiGet(`/auth/session`, {
      headers: {},
    })
    return session
  } catch (error) {
    return null
  }
}

export const UserContext: FC<Props> = ({ children, initialUser }) => {
  const [user, setUser] = useState<IUserRecruteurPublic | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)

  useEffect(() => {
    async function getUser() {
      const user = initialUser ?? (await getSession())
      setUser(user)
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
      }
    }
    emitter.on("http:error", handler)
    return () => emitter.off("http:error", handler)
  }, [])

  if (isLoading) {
    return <Spinner />
  }

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
