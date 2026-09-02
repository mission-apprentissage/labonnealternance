import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { proxy } from "./proxy"

// apiPost (flux magic link) lit les headers de la requête Next via next/headers, indisponible hors
// scope requête dans vitest : on fournit des headers vides, sans incidence sur les autres tests.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))

const BASE_URL = "http://localhost:3000"
const SOME_JWT = "some.jwt.token"

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function requestWithSessionCookie(path: string): NextRequest {
  const request = new NextRequest(new URL(path, BASE_URL))
  request.cookies.set("lba_session", SOME_JWT)
  return request
}

describe("proxy - session confirmée invalide (401)", () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 401 }))
  })

  it("redirige une seule fois de /espace-pro/cfa vers /espace-pro/authentification, purge le cookie et signale l'erreur", async () => {
    const request = requestWithSessionCookie("/espace-pro/cfa")

    const response = await proxy(request)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.pathname).toBe("/espace-pro/authentification")
    expect(location.searchParams.get("error")).toBe("true")
    expect(location.searchParams.get("sessionRetry")).toBeNull()

    const setCookie = response.cookies.get("lba_session")
    expect(setCookie?.value).toBe("")
  })

  it("ne redirige pas une deuxième fois vers /espace-pro/cfa une fois le cookie purgé (pas de boucle)", async () => {
    const firstRequest = requestWithSessionCookie("/espace-pro/cfa")
    const firstResponse = await proxy(firstRequest)
    const redirectLocation = new URL(firstResponse.headers.get("location")!)

    // Le navigateur suit la redirection sans plus jamais envoyer le cookie purgé.
    const secondRequest = new NextRequest(new URL(`${redirectLocation.pathname}${redirectLocation.search}`, BASE_URL))
    fetchMock.mockClear()

    const secondResponse = await proxy(secondRequest)

    // Pas de redirection : la page d'authentification doit s'afficher (avec son message d'erreur).
    expect(secondResponse.status).not.toBe(307)
    expect(secondResponse.headers.get("location")).toBeNull()
    // La session n'ayant plus de cookie, checkSession() ne doit plus appeler l'API auth/session ou auth/access.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("purge aussi le cookie quand on atterrit directement sur /espace-pro/authentification avec un cookie invalide", async () => {
    const request = requestWithSessionCookie("/espace-pro/authentification")

    const response = await proxy(request)

    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("lba_session")?.value).toBe("")
  })
})

describe("proxy - aucun cookie de session", () => {
  it("redirige vers l'authentification sans message d'erreur trompeur ni sessionRetry", async () => {
    const request = new NextRequest(new URL("/espace-pro/cfa", BASE_URL))

    const response = await proxy(request)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.searchParams.get("error")).toBeNull()
    expect(location.searchParams.get("sessionRetry")).toBeNull()
    expect(response.cookies.get("lba_session")).toBeUndefined()
  })
})

describe("proxy - panne API ambiguë (ni confirmée invalide, ni confirmée valide)", () => {
  it("ne purge pas le cookie et n'affiche pas 'session expirée' sur un simple 500", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 500 }))
    const request = requestWithSessionCookie("/espace-pro/cfa")

    const response = await proxy(request)

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.searchParams.get("error")).toBeNull()
    expect(location.searchParams.get("sessionRetry")).toBe("true")
    // Le cookie n'est pas purgé : on ne sait pas s'il est réellement invalide.
    expect(response.cookies.get("lba_session")).toBeUndefined()
  })

  it("ne purge pas le cookie non plus sur une erreur réseau (fetch qui rejette)", async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error("fetch failed: ECONNRESET")
    })
    const request = requestWithSessionCookie("/espace-pro/cfa")

    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(response.cookies.get("lba_session")).toBeUndefined()
    const location = new URL(response.headers.get("location")!)
    expect(location.searchParams.get("sessionRetry")).toBe("true")
  })

  it("ne rebondit pas une deuxième fois vers la page protégée même si la session semble valide au second essai (pas de boucle)", async () => {
    fetchMock.mockImplementationOnce(async () => new Response(null, { status: 500 })).mockImplementationOnce(async () => new Response(null, { status: 500 }))
    const firstRequest = requestWithSessionCookie("/espace-pro/cfa")
    const firstResponse = await proxy(firstRequest)
    const redirectLocation = new URL(firstResponse.headers.get("location")!)
    expect(redirectLocation.searchParams.get("sessionRetry")).toBe("true")

    // Le cookie n'a pas été purgé : le navigateur le renvoie sur le second hop, et cette fois
    // l'API répond que la session est bien valide (flakiness typique décrite dans l'issue #5245).
    const secondRequest = requestWithSessionCookie(`${redirectLocation.pathname}${redirectLocation.search}`)
    fetchMock.mockReset()
    fetchMock.mockImplementation(
      async (url: string) => new Response(url.endsWith("/auth/session") ? JSON.stringify({ _id: "u1", type: "CFA" }) : JSON.stringify({}), { status: 200 })
    )

    const secondResponse = await proxy(secondRequest)

    // Le signal était instable : on ne fait pas confiance à ce "succès" pour rebondir à nouveau
    // vers /espace-pro/cfa. La page d'authentification s'affiche simplement, sans purge.
    expect(secondResponse.headers.get("location")).toBeNull()
    expect(secondResponse.cookies.get("lba_session")).toBeUndefined()
  })
})

describe("proxy - utilisateur connecté sur /espace-pro/authentification", () => {
  beforeEach(() => {
    fetchMock.mockImplementation(
      async (url: string) => new Response(url.endsWith("/auth/session") ? JSON.stringify({ _id: "u1", type: "ENTREPRISE" }) : JSON.stringify({}), { status: 200 })
    )
  })

  it("redirige une navigation classique vers l'accueil de l'utilisateur", async () => {
    const request = requestWithSessionCookie("/espace-pro/authentification")

    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/espace-pro/entreprise")
  })

  it("redirige aussi une navigation client (header RSC sans préchargement)", async () => {
    const request = requestWithSessionCookie("/espace-pro/authentification?_rsc=abc")
    request.headers.set("rsc", "1")

    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/espace-pro/entreprise")
  })

  it("ne redirige pas un préchargement de lien (Next-Router-Prefetch) : sert la page, sans purge (pas de boucle)", async () => {
    const request = requestWithSessionCookie("/espace-pro/authentification?_rsc=abc")
    request.headers.set("rsc", "1")
    request.headers.set("next-router-prefetch", "1")

    const response = await proxy(request)

    expect(response.status).not.toBe(307)
    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("lba_session")).toBeUndefined()
  })

  it("ne redirige pas non plus un préchargement par segment (Next-Router-Segment-Prefetch)", async () => {
    const request = requestWithSessionCookie("/espace-pro/authentification?_rsc=abc")
    request.headers.set("rsc", "1")
    request.headers.set("next-router-segment-prefetch", "/_tree")

    const response = await proxy(request)

    expect(response.headers.get("location")).toBeNull()
  })

  it("un préchargement sans session ne change rien : la page d'authentification est servie", async () => {
    fetchMock.mockReset()
    const request = new NextRequest(new URL("/espace-pro/authentification?_rsc=abc", BASE_URL))
    request.headers.set("next-router-prefetch", "1")

    const response = await proxy(request)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.headers.get("location")).toBeNull()
  })
})

describe("proxy - connexion par magic link (pose du cookie de session)", () => {
  it("pose le cookie avec les attributs alignés sur config.auth.session.cookie côté serveur", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/login/verification")) {
        return new Response(JSON.stringify({ user: { _id: "u1", type: "CFA" }, sessionToken: SOME_JWT }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      throw new Error(`appel inattendu: ${url}`)
    })
    const request = new NextRequest(new URL("/espace-pro/authentification?token=magic-token", BASE_URL))

    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/espace-pro/cfa")

    const cookie = response.cookies.get("lba_session")
    // Valeurs volontairement en dur (pas importées de shared/constants/session) : le test doit
    // casser si SESSION_COOKIE_OPTIONS change, pour forcer une décision explicite.
    expect(cookie).toMatchObject({
      value: SOME_JWT,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      // 30 jours, en secondes (unité du Max-Age)
      maxAge: 30 * 24 * 3600,
    })
  })

  it("la purge émet un Set-Cookie qui matche l'identité du cookie posé (nom + path)", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 401 }))
    const request = requestWithSessionCookie("/espace-pro/cfa")

    const response = await proxy(request)

    // Un cookie est supprimé par le navigateur si nom + domaine + path correspondent :
    // le cookie est posé avec path=/, la purge doit donc porter path=/ et une expiration passée.
    const setCookie = response.headers.get("set-cookie")!
    expect(setCookie.toLowerCase()).toContain("lba_session=;")
    expect(setCookie.toLowerCase()).toContain("path=/")
    expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=thu, 01 jan 1970/)
  })
})
