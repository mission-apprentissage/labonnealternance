import { isDynamicServerError } from "next/dist/client/components/hooks-server-context"
import { headers } from "next/headers"
import { ComputedUserAccess, IUserRecruteurPublic } from "shared"

export async function getSession(): Promise<{ user?: IUserRecruteurPublic | null; access?: ComputedUserAccess | null }> {
  try {
    const headerStore = await headers()
    const sessionRaw = headerStore.get("x-session")

    if (!sessionRaw) {
      return {}
    }

    return JSON.parse(sessionRaw)
  } catch (error) {
    // Useful for NextJS to detect dynamic routes
    if (isDynamicServerError(error)) {
      throw error
    }

    return {}
  }
}
