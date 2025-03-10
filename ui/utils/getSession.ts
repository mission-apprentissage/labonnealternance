import { headers } from "next/headers"
import { ComputedUserAccess, IUserRecruteurPublic } from "shared"

export async function getSession(): Promise<{ user: IUserRecruteurPublic | null; access: ComputedUserAccess | null }> {
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
