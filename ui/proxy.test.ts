import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { proxy } from "./proxy"

const BASE_URL = "http://localhost:3000"
const INVALID_JWT = "invalid.jwt.token"

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockImplementation(async () => new Response(null, { status: 401 }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function requestWithSessionCookie(path: string): NextRequest {
  const request = new NextRequest(new URL(path, BASE_URL))
  request.cookies.set("lba_session", INVALID_JWT)
  return request
}

describe("proxy - session invalide", () => {
  it("redirige une seule fois de /espace-pro/cfa vers /espace-pro/authentification, purge le cookie et signale l'erreur", async () => {
    const request = requestWithSessionCookie("/espace-pro/cfa")

    const response = await proxy(request)

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.pathname).toBe("/espace-pro/authentification")
    expect(location.searchParams.get("error")).toBe("true")

    const setCookie = response.cookies.get("lba_session")
    expect(setCookie?.value).toBe("")
  })

  it("ne redirige pas une deuxième fois vers /espace-pro/cfa une fois le cookie purgé (pas de boucle)", async () => {
    const firstRequest = requestWithSessionCookie("/espace-pro/cfa")
    const firstResponse = await proxy(firstRequest)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const redirectLocation = new URL(firstResponse.headers.get("location")!)

    // Le navigateur suit la redirection sans plus jamais envoyer le cookie purgé.
    const secondRequest = new NextRequest(new URL(`${redirectLocation.pathname}${redirectLocation.search}`, BASE_URL))
    fetchMock.mockClear()

    const secondResponse = await proxy(secondRequest)

    // Pas de redirection : la page d'authentification doit s'afficher (avec son message d'erreur).
    expect(secondResponse.status).not.toBe(307)
    expect(secondResponse.headers.get("location")).toBeNull()
    // La session n'ayant plus de cookie, getSession() ne doit plus appeler l'API auth/session ou auth/access.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("ne redirige pas vers l'authentification quand aucun cookie de session n'est présent (pas de message d'erreur trompeur)", async () => {
    const request = new NextRequest(new URL("/espace-pro/cfa", BASE_URL))

    const response = await proxy(request)

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.searchParams.get("error")).toBeNull()
    expect(response.cookies.get("lba_session")).toBeUndefined()
  })
})
