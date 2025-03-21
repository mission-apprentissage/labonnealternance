import { headers } from "next/headers"
import { IUserRecruteurPublic } from "shared"

export async function getConnectedSessionUser(): Promise<{ user: IUserRecruteurPublic }> {
  const headerStore = await headers()
  const sessionRaw = headerStore.get("x-session")

  if (!sessionRaw) {
    throw new Error("Session not found")
  }

  return JSON.parse(sessionRaw)
}
