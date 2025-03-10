import { headers } from "next/headers"
import type { PropsWithChildren } from "react"
import { type IUserRecruteurPublic } from "shared"

import { Footer } from "../_components/Footer"

import { EspaceProHeader } from "./_components/EspaceProHeader"

export async function getSession(): Promise<IUserRecruteurPublic | null> {
  try {
    const headerStore = await headers()
    const userRaw = headerStore.get("x-user")

    if (!userRaw) {
      return null
    }

    return JSON.parse(userRaw)
  } catch (error) {
    return null
  }
}

export default async function RecruteurLayout({ children }: PropsWithChildren) {
  const user = await getSession()

  return (
    <>
      <EspaceProHeader user={user} />
      {children}
      <Footer />
    </>
  )
}
