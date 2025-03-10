import type { PropsWithChildren } from "react"

import { getSession } from "@/utils/getSession"

import { UserContextProvider } from "../contexts/userContext"

export default async function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  const { user, access } = await getSession()

  return (
    <UserContextProvider user={user} access={access}>
      {children}
    </UserContextProvider>
  )
}
