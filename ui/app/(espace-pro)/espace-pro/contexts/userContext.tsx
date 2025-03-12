"use client"

import { createContext, use, type PropsWithChildren } from "react"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"

export type IUserContext = {
  user?: IUserRecruteurPublic
  access?: ComputedUserAccess
}

export const UserContext = createContext<IUserContext>(null)

export function UserContextProvider(props: PropsWithChildren<IUserContext>) {
  return <UserContext.Provider value={{ user: props.user, access: props.access }}>{props.children}</UserContext.Provider>
}

export function useConnectedSessionClient(): IUserContext {
  const userContext = use(UserContext)

  if (!userContext) {
    throw new Error("User context provider is not found in the component tree")
  }

  return userContext
}
