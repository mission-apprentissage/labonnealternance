"use client"

import { createContext, use, type PropsWithChildren } from "react"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"

export const UserContext = createContext<{ user: IUserRecruteurPublic | null; access: ComputedUserAccess | null }>(null)

export function UserContextProvider(props: PropsWithChildren<{ user: IUserRecruteurPublic; access: ComputedUserAccess }>) {
  return <UserContext.Provider value={{ user: props.user, access: props.access }}>{props.children}</UserContext.Provider>
}

export function useConnectedSessionClient(): { user: IUserRecruteurPublic | null; access: ComputedUserAccess | null } {
  const userContext = use(UserContext)

  if (!userContext) {
    throw new Error("User context provider is not found in the component tree")
  }

  return userContext
}
