import { captureException } from "@sentry/nextjs"
import { NextRequest } from "next/server"
import { SESSION_RETRY_PARAM } from "shared/constants/session"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { proxy } from "./proxy"
import { resolveFicheLookup } from "./utils/fiche-introuvable.utils"

// apiPost (flux magic link) lit les headers de la requête Next via next/headers, indisponible hors
// scope requête dans vitest : on fournit des headers vides, sans incidence sur les autres tests.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }))

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

  it("sert sans session la page de clôture ouverte depuis le lien par jeton d'un mail", async () => {
    const request = new NextRequest(new URL("/espace-pro/offre/offres_emploi_lba/6650a1b2c3d4e5f6a7b8c9d0/cancel?token=some.jwt.token", BASE_URL))

    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
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

  it("sert la page de connexion, sans rebond, sur l'URL exacte émise par le filet de sécurité du layout connecté", async () => {
    // Contrat avec ui/app/(espace-pro)/espace-pro/(connected)/layout.tsx : quand getSession() est vide
    // alors que le proxy a laissé passer, le layout redirige vers cette URL. Le proxy doit l'afficher
    // même si la session lui paraît valide, sinon la boucle 307 ↔ 307 du 2026-09-02 revient.
    fetchMock.mockImplementation(
      async (url: string) => new Response(url.endsWith("/auth/session") ? JSON.stringify({ _id: "u1", type: "ENTREPRISE" }) : JSON.stringify({}), { status: 200 })
    )
    const request = requestWithSessionCookie(`/espace-pro/authentification?${SESSION_RETRY_PARAM}=true`)

    const response = await proxy(request)

    expect(response.status).not.toBe(307)
    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("lba_session")).toBeUndefined()
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

  it("ne redirige pas un préchargement de lien (Next-Router-Prefetch) : sert la page avec la session, sans purge (pas de boucle)", async () => {
    const request = requestWithSessionCookie("/espace-pro/authentification?_rsc=abc")
    request.headers.set("rsc", "1")
    request.headers.set("next-router-prefetch", "1")

    const response = await proxy(request)

    expect(response.status).not.toBe(307)
    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("lba_session")).toBeUndefined()
    // Le rendu préchargé reçoit la session : le header affiche l'utilisateur connecté, pas « Connexion ».
    expect(response.headers.get("x-middleware-request-x-session")).toContain('"_id":"u1"')
  })

  it("un préchargement d'une route protégée par un utilisateur autorisé passe toujours, avec la session", async () => {
    const request = requestWithSessionCookie("/espace-pro/entreprise?_rsc=abc")
    request.headers.set("rsc", "1")
    request.headers.set("next-router-prefetch", "1")

    const response = await proxy(request)

    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-request-x-session")).toContain('"_id":"u1"')
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

describe("proxy - filtre OPCO de session", () => {
  it("pose le cookie depuis une page publique d'arrivée, sans appel d'API de session", async () => {
    const response = await proxy(new NextRequest(new URL("/?opco=ep", BASE_URL)))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.cookies.get("lba_opco")?.value).toBe("EP")
  })

  it("le pose aussi sur une redirection (page protégée sans session)", async () => {
    const response = await proxy(new NextRequest(new URL("/espace-pro/cfa?opco=akto", BASE_URL)))

    expect(response.status).toBe(307)
    expect(response.cookies.get("lba_opco")?.value).toBe("AKTO")
  })
})

describe("proxy - fiche introuvable (vrai 404 avant le streaming)", () => {
  const INTERNAL_API = "http://server:5000/api"
  const SIRET = "12345678900011"
  const FICHE = `/emploi/recruteurs_lba/${SIRET}/boulangerie`
  const OBJECT_ID = "6a003cc09a6be614e49184f3"
  // Forme réelle d'une cle_ministere_educatif : le `#` arrive encodé dans l'URL de la fiche.
  const CLE_FORMATION = "121115P01313885594860007738855948600077-38053#L01"

  beforeEach(() => {
    vi.stubEnv("LBA_INTERNAL_API_URL", INTERNAL_API)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(captureException).mockClear()
  })

  const rewriteTarget = (response: Response): string | null => {
    const rewrite = response.headers.get("x-middleware-rewrite")
    return rewrite ? new URL(rewrite).pathname : null
  }

  it("laisse passer une fiche qui existe, sans signalement", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }))

    const response = await proxy(new NextRequest(new URL(FICHE, BASE_URL)))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`${INTERNAL_API}/_private/jobs/recruteurs_lba/${SIRET}`)
    expect(rewriteTarget(response)).toBeNull()
    expect(captureException).not.toHaveBeenCalled()
  })

  it.each([
    ["une panne de l'API (500)", () => Promise.resolve(new Response(null, { status: 500 }))],
    ["une limite de débit (429)", () => Promise.resolve(new Response(null, { status: 429 }))],
    ["une erreur réseau ou un timeout", () => Promise.reject(new DOMException("timeout", "TimeoutError"))],
  ])("laisse passer et signale à Sentry %s", async (_, reply) => {
    fetchMock.mockImplementation(reply)

    const response = await proxy(new NextRequest(new URL(FICHE, BASE_URL)))

    expect(rewriteTarget(response)).toBeNull()
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(vi.mocked(captureException).mock.calls[0][1]).toMatchObject({ fingerprint: ["fiche-introuvable-lookup"] })
  })

  it.each([
    ["navigation client", { rsc: "1" }],
    ["préchargement", { "next-router-prefetch": "1" }],
    ["préchargement par segment", { "next-router-segment-prefetch": "/_tree" }],
  ])("n'interroge pas l'API sur une %s", async (_, headers) => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    const response = await proxy(new NextRequest(new URL(FICHE, BASE_URL), { headers }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(rewriteTarget(response)).toBeNull()
  })

  it.each([
    ["une fiche sans slug", `/emploi/recruteurs_lba/${SIRET}`],
    ["une sous-page de la fiche", `${FICHE}/autre`],
    ["un identifiant mal encodé", "/formation/%/x"],
    ["une page voisine", "/emploi-recruteurs_lba/1/x"],
  ])("n'interroge pas l'API pour %s", async (_, path) => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    const response = await proxy(new NextRequest(new URL(path, BASE_URL)))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(rewriteTarget(response)).toBeNull()
  })

  it("réécrit vers la 404 racine quand l'API confirme le 404, sans signalement", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    const response = await proxy(new NextRequest(new URL(FICHE, BASE_URL)))

    expect(rewriteTarget(response)).toBe("/_fiche-introuvable")
    expect(captureException).not.toHaveBeenCalled()
  })

  it("vérifie une fiche formation à l'identifiant réel et la réécrit si elle est introuvable", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    const response = await proxy(new NextRequest(new URL(`/formation/${encodeURIComponent(CLE_FORMATION)}/bts-mco`, BASE_URL)))

    expect(fetchMock.mock.calls[0][0]).toBe(`${INTERNAL_API}/_private/formations/121115P01313885594860007738855948600077-38053%23L01`)
    expect(rewriteTarget(response)).toBe("/_fiche-introuvable")
  })

  it.each([
    ["un séparateur encodé", "/formation/a%2Fb/x", `${INTERNAL_API}/_private/formations/a%2Fb`],
    ["un point-point doublement encodé", "/formation/%252E%252E/x", `${INTERNAL_API}/_private/formations/%252E%252E`],
  ])("garde %s dans un seul segment de l'API", async (_, path, expectedUrl) => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }))

    await proxy(new NextRequest(new URL(path, BASE_URL)))

    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl)
  })

  it("vérifie une offre à l'ObjectId valide", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))

    const response = await proxy(new NextRequest(new URL(`/emploi/offres_emploi_partenaires/${OBJECT_ID}/x`, BASE_URL)))

    expect(fetchMock.mock.calls[0][0]).toBe(`${INTERNAL_API}/_private/jobs/offres_emploi_partenaires/${OBJECT_ID}`)
    expect(rewriteTarget(response)).toBe("/_fiche-introuvable")
  })

  it.each([
    ["un type d'offre inconnu", `/emploi/inconnu/${SIRET}/x`],
    ["une offre LBA dont l'id n'est pas un ObjectId", "/emploi/offres_emploi_lba/x/y"],
    ["une offre partenaire à l'ObjectId tronqué", `/emploi/offres_emploi_partenaires/${OBJECT_ID.slice(1)}/y`],
  ])("réécrit %s sans appeler l'API", async (_, path) => {
    const response = await proxy(new NextRequest(new URL(path, BASE_URL)))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(rewriteTarget(response)).toBe("/_fiche-introuvable")
  })

  it.each(["/formation/%2E%2E/x", "/formation/./x", "/emploi/recruteurs_lba/../x"])(
    "ne vérifie pas un identifiant qui désigne un répertoire (%s), même hors normalisation d'URL",
    (pathname) => {
      expect(resolveFicheLookup(pathname)).toBeNull()
    }
  )
})
