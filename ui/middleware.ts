import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"
import { AUTHTYPE } from "shared/constants/index"

import { apiPost } from "@/utils/api.utils"

import { publicConfig } from "./config.public"
import { PAGES } from "./utils/routes.utils"

const removeAtEnd = (url: string, removed: string): string => (url.endsWith(removed) ? url.slice(0, -removed.length) : url)

async function getSession(request: NextRequest): Promise<{ user: IUserRecruteurPublic | null; userAccess: ComputedUserAccess | null } | null> {
  try {
    const sessionCookie = request.cookies.get("lba_session")

    if (!sessionCookie) {
      return null
    }

    const headers = new Headers()
    headers.append("cookie", `lba_session=${sessionCookie.value}`)

    // Best would be: jwt.decode(sessionCookie.value)

    const [sessionRequest, accessRequest] = await Promise.all([
      fetch(`${removeAtEnd(publicConfig.apiEndpoint, "/")}/auth/session`, {
        headers,
      }),
      fetch(`${removeAtEnd(publicConfig.apiEndpoint, "/")}/auth/access`, {
        headers,
      }),
    ])

    if (!sessionRequest.ok || !accessRequest.ok) {
      return null
    }

    return { user: await sessionRequest.json(), userAccess: await accessRequest.json() }
  } catch (error) {
    return null
  }
}

const verifyAuthentication = async (token: string, request: NextRequest) => {
  try {
    const { user, sessionToken } = await apiPost("/login/verification", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    const response = await redirectAfterAuthentication(user, request)
    response.cookies.set("lba_session", sessionToken)

    return response
  } catch (error) {
    return NextResponse.redirect(new URL("/espace-pro/authentification?error=true", request.url))
  }
}

const redirectAfterAuthentication = async (user: IUserRecruteurPublic, request: NextRequest) => {
  const path = PAGES.dynamic.backHome({ userType: user.type }).getPath()
  return NextResponse.redirect(new URL(path, request.url))
}

const isUnallowedPathForUser = (user: IUserRecruteurPublic, pathname: string) => {
  return (
    (!(user.type === AUTHTYPE.ADMIN) && pathname.startsWith("/espace-pro/administration")) ||
    (!(user.type === AUTHTYPE.ENTREPRISE) && pathname.startsWith("/espace-pro/entreprise")) ||
    (!(user.type === AUTHTYPE.OPCO) && pathname.startsWith("/espace-pro/opco")) ||
    (!(user.type === AUTHTYPE.CFA) && pathname.startsWith("/espace-pro/cfa"))
  )
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  const session = await getSession(request)
  const user = session?.user
  const query = new URLSearchParams(search)
  const token = query.get("token")

  if (pathname === "/espace-pro/authentification") {
    if (token) {
      return await verifyAuthentication(token, request)
    }
    if (user) {
      return redirectAfterAuthentication(user, request)
    }
    return
  }

  if (isConnectionRequired(pathname) && (!user || isUnallowedPathForUser(user, pathname))) {
    return NextResponse.redirect(new URL("/espace-pro/authentification", request.url))
  }

  if (session) {
    requestHeaders.set("x-session", JSON.stringify(session))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

const excludedStartPaths = [
  "/espace-pro/authentification/validation/",
  "/espace-pro/authentification/en-attente",
  "/espace-pro/authentification/confirmation",
  "/espace-pro/authentification/optout/verification",
  "/espace-pro/widget/",
  "/espace-pro/creation/",
  "/espace-pro/offre/impression/",
  "/espace-pro/proposition/formulaire/",
  "/espace-pro/mise-en-relation/",
]
const isConnectionRequired = (path: string) => {
  if (!path.startsWith("/espace-pro/")) {
    return false
  }
  return !excludedStartPaths.some((excludedStartPath) => path.startsWith(excludedStartPath))
}

export const config = {
  matcher: [
    {
      source: "/:path*",
    },
  ],
}
