import { headers } from "next/headers"
import type { PropsWithChildren } from "react"
import { type IUserRecruteurPublic } from "shared"

import { UserContextProvider } from "../contexts/userContext"

export async function getSession(): Promise<IUserRecruteurPublic | null> {
  try {
    const headerStore = await headers()
    const sessionRaw = headerStore.get("x-session")

    if (!sessionRaw) {
      return null
    }

    return JSON.parse(sessionRaw)
  } catch (error) {
    return null
  }
}

export default async function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  const session = await getSession()

  return <UserContextProvider session={session}>{children}</UserContextProvider>
}
