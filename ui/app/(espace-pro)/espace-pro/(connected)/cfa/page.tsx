import { headers } from "next/headers"
import type { IUserRecruteurPublic } from "shared"

export async function getConnectedSessionServer(): Promise<IUserRecruteurPublic> {
  const headerStore = await headers()
  const sessionRaw = headerStore.get("x-session")

  if (!sessionRaw) {
    throw new Error("Session not found")
  }

  return JSON.parse(sessionRaw)
}

export default async function CfaPage() {
  const session = await getConnectedSessionServer()

  return <>Welcome CFA {session.first_name}</>
}
