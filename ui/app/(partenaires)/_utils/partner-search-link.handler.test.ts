import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }))
vi.mock("@sentry/nextjs", () => ({ captureException }))
// apiGet relit les cookies de la requête côté serveur : hors rendu Next, headers() n'existe pas.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))

import { handlePartnerSearchRedirect } from "./partner-search-link.handler"

const fetchMock = vi.fn<typeof fetch>()

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })

const redirect = async (code: string, query = "") => {
  const response = await handlePartnerSearchRedirect("monmaster", code, new URLSearchParams(query))
  const location = new URL(response.headers.get("Location")!, "http://localhost")
  return { response, location }
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
  captureException.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe("handlePartnerSearchRedirect", () => {
  it("redirige en 307 vers la recherche résolue, non mise en cache ni indexée", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ q: "Chef / Cheffe de produit", lieu_label: "Paris" }))

    const { response, location } = await redirect("RNCP42353", "latitude=48.85&longitude=2.35")

    expect(response.status).toBe(307)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex")
    expect(location.pathname).toBe("/recherche")
    expect(location.searchParams.get("q")).toBe("Chef / Cheffe de produit")
    expect(location.searchParams.get("lieu_label")).toBe("Paris")
  })

  it("borne l'attente de la résolution : la requête porte un signal d'abandon", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ q: null, lieu_label: null }))

    await redirect("RNCP42353")

    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it("replie sur la recherche géo seule quand la résolution échoue, et le signale à Sentry", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))

    const { response, location } = await redirect("RNCP42353", "latitude=48.85&longitude=2.35")

    expect(response.status).toBe(307)
    expect(location.pathname).toBe("/recherche")
    expect(location.searchParams.has("q")).toBe(false)
    expect(location.searchParams.get("latitude")).toBe("48.85")
    expect(location.searchParams.get("search_source")).toBe("partner_links")
    expect(captureException).toHaveBeenCalledOnce()
  })

  it("replie aussi sur une réponse d'erreur de l'API", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))

    const { response, location } = await redirect("RNCP42353")

    expect(response.status).toBe(307)
    expect(location.searchParams.has("q")).toBe(false)
    expect(captureException).toHaveBeenCalledOnce()
  })

  it("envoie vide un code trop long plutôt que tronqué", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ q: null, lieu_label: null }))

    // Tronqué à 12 caractères puis trimé, ce code deviendrait « RNCP12 », valide.
    await redirect("RNCP12       x")

    const requested = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requested.searchParams.get("code")).toBe("")
  })

  it("n'envoie pas de coordonnées à virgule décimale", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ q: null, lieu_label: null }))

    await redirect("RNCP42353", "latitude=48,85&longitude=2,35")

    const requested = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requested.searchParams.has("latitude")).toBe(false)
    expect(requested.searchParams.has("longitude")).toBe(false)
  })
})
