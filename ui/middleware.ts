import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"
import { AUTHTYPE } from "shared/constants"

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const requestHeaders = new Headers(request.headers)
  const session = await getSession(request)
  const { user } = session

  if (pathname.startsWith("/espace-pro/authentification/verification")) {
    // TODO: do verification in middleware
    return
  }

  if (pathname === "/espace-pro/authentification") {
    if (user) {
      switch (user.type) {
        case AUTHTYPE.ENTREPRISE:
          return NextResponse.redirect(new URL(`/espace-pro/entreprise/${user.establishment_id}`, request.url))
        // router.push({
        //   pathname: `/espace-pro/administration/entreprise/${user.establishment_id}`,
        //   query: { offerPopup: Object.keys(fromEntrepriseCreation).length > 0 ? true : false },
        // })

        case AUTHTYPE.OPCO:
          // router.push(`/espace-pro/administration/opco`)
          return NextResponse.redirect(new URL(`/espace-pro/opco`, request.url))

        case AUTHTYPE.CFA:
          // router.push("/espace-pro/administration")
          return NextResponse.redirect(new URL(`/espace-pro/cfa`, request.url))

        case AUTHTYPE.ADMIN:
          // router.push("/espace-pro/administration/users")
          return NextResponse.redirect(new URL(`/espace-pro/admin`, request.url))

        default:
      }

      return NextResponse.redirect(new URL("/espace-pro/administration", request.url))
    }

    return
  }

  if (!user) {
    return NextResponse.redirect(new URL("/espace-pro/authentification", request.url))
  }

  requestHeaders.set("x-session", JSON.stringify(session))

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    {
      source: "/espace-pro/:path*",
    },
  ],
}
