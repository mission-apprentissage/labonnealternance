import { headers } from "next/headers"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"

export async function getSession(): Promise<{ user?: IUserRecruteurPublic | null; access?: ComputedUserAccess | null }> {
  "use cache: private"

  const headerStore = await headers()
  const sessionRaw = headerStore.get("x-session")

  if (!sessionRaw) {
    return {}
  }

  try {
    return JSON.parse(sessionRaw)
  } catch {
    return {}
  }
}
