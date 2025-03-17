import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"
import { AUTHTYPE } from "shared/constants/index"

import { apiPost } from "@/utils/api.utils"

import { publicConfig } from "./config.public"

const removeAtEnd = (url: string, removed: string): string => (url.endsWith(removed) ? url.slice(0, -removed.length) : url)

async function getSession(request: NextRequest): Promise<{ user: IUserRecruteurPublic | null; userAccess: ComputedUserAccess | null }> {
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

const verifyAuthentication = async (search: string, request: NextRequest) => {
  const query = new URLSearchParams(search)
  const token = query.get("token")
  if (!token) {
    return
  }
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
  switch (user.type) {
    case AUTHTYPE.ENTREPRISE:
      return NextResponse.redirect(new URL(`/espace-pro/entreprise`, request.url))

    case AUTHTYPE.OPCO:
      return NextResponse.redirect(new URL(`/espace-pro/opco`, request.url))

    case AUTHTYPE.CFA:
      return NextResponse.redirect(new URL(`/espace-pro/cfa`, request.url))

    case AUTHTYPE.ADMIN:
      return NextResponse.redirect(new URL(`/espace-pro/administration/users`, request.url))

    default:
  }

  return NextResponse.redirect(new URL("/espace-pro/administration", request.url))
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
  if (excludedStartPaths.some((excludedStartPath) => pathname.startsWith(excludedStartPath))) {
    return
  }

  const requestHeaders = new Headers(request.headers)
  const session = await getSession(request)
  const user = session?.user

  if (pathname === "/espace-pro/authentification") {
    if (user) {
      return redirectAfterAuthentication(user, request)
    }

    return await verifyAuthentication(search, request)
  }

  if (!user) {
    return NextResponse.redirect(new URL("/espace-pro/authentification", request.url))
  }

  if (isUnallowedPathForUser(user, pathname)) {
    return NextResponse.redirect(new URL("/espace-pro/authentification", request.url))
  }

  requestHeaders.set("x-session", JSON.stringify(session))

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

const excludedStartPaths = ["/espace-pro/widget/", "/espace-pro/creation/", "/espace-pro/offre/impression/"]

export const config = {
  matcher: [
    {
      source: "/espace-pro/:path*",
    },
  ],
}
