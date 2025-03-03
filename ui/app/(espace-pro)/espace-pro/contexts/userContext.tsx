"use client"

import { createContext, use, type PropsWithChildren } from "react"
import type { IUserRecruteurPublic } from "shared"

export const UserContext = createContext<IUserRecruteurPublic | null>(null)

export function UserContextProvider(props: PropsWithChildren<{ session: IUserRecruteurPublic }>) {
  return <UserContext.Provider value={props.session}>{props.children}</UserContext.Provider>
}

export function useConnectedSessionClient(): IUserRecruteurPublic {
  const session = use(UserContext)

  if (!session) {
    throw new Error("User context provider is not found in the component tree")
  }

  return session
}
