import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { ComputedUserAccess, IUserRecruteurPublic } from "shared"
import { AUTHTYPE } from "shared/constants/index"
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_RETRY_PARAM } from "shared/constants/session"

import { publicConfig } from "./config.public"
import { apiPost } from "./utils/api.utils"
import { PAGES } from "./utils/routes.utils"

const removeAtEnd = (url: string, removed: string): string => (url.endsWith(removed) ? url.slice(0, -removed.length) : url)

// SESSION_RETRY_PARAM (shared/constants/session) : marqueur de rebond posé sur la redirection
// espace-pro protégée → authentification quand la session n'a pas pu être confirmée invalide (panne
// API, pas de 401), et par le layout connecté quand la session est illisible dans le rendu. S'il est
// déjà présent quand on atterrit sur /espace-pro/authentification, on ne fait plus jamais confiance
// à un résultat "session valide" pour rebondir une nouvelle fois vers la page protégée : un signal
// instable (JWT proche de l'expiration, API auth flaky) ne doit jamais produire plus d'un
// aller-retour (cf. issue #5245).

// Un préchargement Next (<Link prefetch>, segment cache) n'est pas une navigation : rediriger un
// utilisateur connecté vers son accueil depuis /espace-pro/authentification n'a aucun sens dans ce
// cas, et produit une boucle 307 ↔ 307 quand la page d'origine affiche un lien « Connexion » (le
// navigateur suit la redirection, Next re-redirige pour rétablir le paramètre _rsc, et le routeur
// relance le préchargement — incident du 2026-09-02). On sert alors la page telle quelle.
const isPrefetchRequest = (request: NextRequest): boolean => request.headers.has("next-router-prefetch") || request.headers.has("next-router-segment-prefetch")

type SessionCheckResult =
  | { kind: "no-cookie" }
  | { kind: "ok"; user: IUserRecruteurPublic; access: ComputedUserAccess }
  // 401 renvoyé explicitement par /auth/session ou /auth/access : le token est bien rejeté, sans
  // ambiguïté. Sûr de purger le cookie.
  | { kind: "invalid" }
  // Panne de l'API (5xx, réseau, timeout...) : impossible de savoir si la session est valide.
  // Ne jamais purger le cookie ni afficher "session expirée" sur la seule foi de ce signal.
  | { kind: "unavailable" }

async function checkSession(request: NextRequest): Promise<SessionCheckResult> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  if (!sessionCookie) {
    return { kind: "no-cookie" }
  }

  const headers = new Headers()
  headers.append("cookie", `${SESSION_COOKIE_NAME}=${sessionCookie.value}`)

  // Best would be: jwt.decode(sessionCookie.value)

  try {
    const [sessionRequest, accessRequest] = await Promise.all([
      fetch(`${removeAtEnd(publicConfig.apiEndpoint, "/")}/auth/session`, {
        headers,
      }),
      fetch(`${removeAtEnd(publicConfig.apiEndpoint, "/")}/auth/access`, {
        headers,
      }),
    ])

    if (sessionRequest.status === 401 || accessRequest.status === 401) {
      return { kind: "invalid" }
    }

    if (!sessionRequest.ok || !accessRequest.ok) {
      return { kind: "unavailable" }
    }

    return { kind: "ok", user: await sessionRequest.json(), access: await accessRequest.json() }
  } catch (_) {
    return { kind: "unavailable" }
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
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS)

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

const redirectToAuthentication = (request: NextRequest, options: { purgeCookie: boolean; error: boolean; retry: boolean }) => {
  const url = new URL("/espace-pro/authentification", request.url)
  if (options.error) {
    url.searchParams.set("error", "true")
  }
  if (options.retry) {
    url.searchParams.set(SESSION_RETRY_PARAM, "true")
  }
  const response = NextResponse.redirect(url)
  if (options.purgeCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME)
  }
  return response
}

// Laisse passer la requête vers le rendu Next en lui transmettant la session résolue par le proxy.
const passThroughWithSession = (request: NextRequest, result: SessionCheckResult) => {
  const requestHeaders = new Headers(request.headers)
  // seul le proxy a le droit de poser x-session : un client ne doit pas pouvoir le forger
  requestHeaders.delete("x-session")
  if (result.kind === "ok") {
    requestHeaders.set("x-session", JSON.stringify({ user: result.user, access: result.access }))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

const renderAuthenticationPage = (request: NextRequest, options: { purgeCookie: boolean }) => {
  // même sans session, ne pas laisser passer un x-session forgé par le client
  const anonymousHeaders = new Headers(request.headers)
  anonymousHeaders.delete("x-session")
  const response = NextResponse.next({ request: { headers: anonymousHeaders } })
  if (options.purgeCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME)
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const query = new URLSearchParams(search)

  if (pathname === "/espace-pro/authentification") {
    const token = query.get("token")
    if (token) {
      return await verifyAuthentication(token, request)
    }

    const result = await checkSession(request)

    if (result.kind === "ok") {
      if (isPrefetchRequest(request)) {
        // La session est transmise au rendu pour que le header préchargé affiche bien l'utilisateur.
        return passThroughWithSession(request, result)
      }
      if (query.get(SESSION_RETRY_PARAM)) {
        // On vient de rebondir depuis une route protégée qui n'a pas pu confirmer la session
        // (panne API ambiguë) : même si elle semble valide ici, ne pas rebondir une nouvelle fois,
        // le signal est instable. L'utilisateur devra se reconnecter manuellement une fois l'API
        // stabilisée.
        return renderAuthenticationPage(request, { purgeCookie: false })
      }
      return redirectAfterAuthentication(result.user, request)
    }

    return renderAuthenticationPage(request, { purgeCookie: result.kind === "invalid" })
  }

  const result = await checkSession(request)

  if (isConnectionRequired(pathname)) {
    if (result.kind === "ok") {
      if (isUnallowedPathForUser(result.user, pathname)) {
        return NextResponse.redirect(new URL("/espace-pro/authentification", request.url))
      }
    } else if (result.kind === "invalid") {
      return redirectToAuthentication(request, { purgeCookie: true, error: true, retry: false })
    } else if (result.kind === "unavailable") {
      const alreadyRetried = Boolean(query.get(SESSION_RETRY_PARAM))
      return redirectToAuthentication(request, { purgeCookie: false, error: false, retry: !alreadyRetried })
    } else {
      return redirectToAuthentication(request, { purgeCookie: false, error: false, retry: false })
    }
  }

  return passThroughWithSession(request, result)
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
