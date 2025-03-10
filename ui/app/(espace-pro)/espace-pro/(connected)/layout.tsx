import { headers } from "next/headers"
import type { PropsWithChildren } from "react"
import { ComputedUserAccess, type IUserRecruteurPublic } from "shared"

import { UserContextProvider } from "../contexts/userContext"

export async function getSession(): Promise<{ user: IUserRecruteurPublic | null; access: ComputedUserAccess | null }> {
  try {
    const headerStore = await headers()
    const userRaw = headerStore.get("x-user")
    const accessRaw = headerStore.get("x-access")

    if (!userRaw || !accessRaw) {
      return null
    }

    return { user: JSON.parse(userRaw), access: JSON.parse(accessRaw) }
  } catch (error) {
    return null
  }
}

export default async function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  const { user, access } = await getSession()

  return (
    <UserContextProvider user={user} access={access}>
      {children}
    </UserContextProvider>
  )
}
