import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"
import { AUTHTYPE } from "shared/constants/index"

import { publicConfig } from "./config.public"
import { apiPost } from "./utils/api.utils"
import { PAGES } from "./utils/routes.utils"

const removeAtEnd = (url: string, removed: string): string => (url.endsWith(removed) ? url.slice(0, -removed.length) : url)

async function getSession(request: NextRequest): Promise<{ user: IUserRecruteurPublic | null; access: ComputedUserAccess | null } | null> {
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

    return { user: await sessionRequest.json(), access: await accessRequest.json() }
  } catch (_) {
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
  } catch (_) {
    return NextResponse.redirect(new URL("/espace-pro/authentification?error=true", request.url))
  }
}

const redirectAfterAuthentication = async (user: IUserRecruteurPublic, request: NextRequest) => {
  const redirectQueryParam = new URL(request.url).searchParams.get("redirect")
  const isSafe = redirectQueryParam?.startsWith("/") && !redirectQueryParam.startsWith("//") && !redirectQueryParam.includes("\\")
  const path = isSafe ? redirectQueryParam : PAGES.dynamic.backHome({ userType: user.type }).getPath()
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

// Un cookie lba_session invalide/expiré doit être purgé avant de renvoyer vers l'authentification :
// sinon la prochaine requête retente les mêmes appels /auth/session et /auth/access, et une
// réponse instable (JWT proche de l'expiration) peut faire rebondir l'utilisateur en boucle
// entre la page protégée et /espace-pro/authentification (cf. issue #5245).
const redirectToInvalidSession = (request: NextRequest) => {
  const hadSessionCookie = Boolean(request.cookies.get("lba_session"))
  const url = new URL(hadSessionCookie ? "/espace-pro/authentification?error=true" : "/espace-pro/authentification", request.url)
  const response = NextResponse.redirect(url)
  if (hadSessionCookie) {
    response.cookies.delete("lba_session")
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === "/espace-pro/authentification") {
    const query = new URLSearchParams(search)
    const token = query.get("token")
    if (token) {
      return await verifyAuthentication(token, request)
    }
    const hadSessionCookie = Boolean(request.cookies.get("lba_session"))
    const session = await getSession(request)
    const user = session?.user
    if (user) {
      return redirectAfterAuthentication(user, request)
    }
    // même sans session, ne pas laisser passer un x-session forgé par le client
    const anonymousHeaders = new Headers(request.headers)
    anonymousHeaders.delete("x-session")
    const response = NextResponse.next({ request: { headers: anonymousHeaders } })
    if (hadSessionCookie) {
      response.cookies.delete("lba_session")
    }
    return response
  }
  const session = await getSession(request)
  const user = session?.user
  if (isConnectionRequired(pathname)) {
    if (!user) {
      return redirectToInvalidSession(request)
    }
    if (isUnallowedPathForUser(user, pathname)) {
      return NextResponse.redirect(new URL("/espace-pro/authentification", request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  // seul le proxy a le droit de poser x-session : un client ne doit pas pouvoir le forger
  requestHeaders.delete("x-session")
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
      // Exclut les assets statiques et le manifest PWA : le proxy résout la session via
      // 2 appels API dès que le cookie lba_session est présent, inutile pour ces fichiers
      source: "/((?!_next/static|_next/image|favicon|images|assets|fonts|styles|ressources|manifest\\.webmanifest).*)",
    },
  ],
}
