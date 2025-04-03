import { isDynamicServerError } from "next/dist/client/components/hooks-server-context"
import { cookies, headers } from "next/headers"
import { cache } from "react"
import { ComputedUserAccess, IUserRecruteurPublic } from "shared"

async function getSessionFn(): Promise<{ user?: IUserRecruteurPublic | null; access?: ComputedUserAccess | null }> {
  try {
    const cookieStore = await cookies()
    if (!cookieStore.get("lba_session").value) {
      return {}
    }

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

export const getSession = cache(getSessionFn)
