import type { FastifyReply, FastifyRequest } from "fastify"
import { describe, expect, it } from "vitest"

import { serializers } from "./logger"

const FAKE_JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature"

const fakeRequest = (overrides: Partial<Record<keyof FastifyRequest, unknown>> = {}) =>
  ({
    method: "GET",
    url: "/api/healthcheck",
    hostname: "localhost",
    ip: "127.0.0.1",
    socket: { remotePort: 1234 },
    id: "req-1",
    headers: {},
    query: {},
    params: {},
    body: null,
    ...overrides,
  }) as unknown as FastifyRequest

const fakeReply = (url: string, headers: Record<string, unknown>) =>
  ({ request: { id: "req-1", method: "GET", url }, elapsedTime: 12, statusCode: 302, getHeaders: () => headers }) as unknown as Parameters<typeof serializers.res>[0] & FastifyReply

describe("serializers.req", () => {
  it("masque le cookie, qui porte la session", () => {
    const { headers } = serializers.req(fakeRequest({ headers: { cookie: `lba_session=${FAKE_JWT}; _pk_id=abc`, host: "localhost" } })) as { headers: Record<string, unknown> }
    expect(headers.cookie).toBe(null)
    expect(headers.host).toBe("localhost")
  })

  it("masque le jeton et l'email du lien magique porté par le referer, sans perdre le chemin", () => {
    const referer = `https://lba.fr/espace-pro/creation/offre?establishment_id=abc_123&email=test%40exemple.fr&token=${FAKE_JWT}&displayBanner=true`
    const { headers } = serializers.req(fakeRequest({ headers: { referer } })) as { headers: Record<string, string> }
    expect(headers.referer).toBe("https://lba.fr/espace-pro/creation/offre?establishment_id=abc_123&email=[Filtered]&token=[Filtered]&displayBanner=true")
  })

  it("laisse intact, octet pour octet, un referer sans paramètre sensible", () => {
    const referer = "https://lba.fr/recherche?q=d%C3%A9veloppeur&lat=48.85&lon=2.35#resultats"
    const { headers } = serializers.req(fakeRequest({ headers: { referer } })) as { headers: Record<string, string> }
    expect(headers.referer).toBe(referer)
  })

  it("ne masque pas un paramètre dont seule la valeur évoque un jeton", () => {
    const { url } = serializers.req(fakeRequest({ url: "/api/v1/search?q=token&topic=tok" })) as { url: string }
    expect(url).toBe("/api/v1/search?q=token&topic=tok")
  })

  it("masque un jeton passé en query dans le champ url, déjà masqué dans query", () => {
    const { url, query } = serializers.req(fakeRequest({ url: `/api/route?page=2&token=${FAKE_JWT}#ancre`, query: { page: "2", token: FAKE_JWT } })) as {
      url: string
      query: Record<string, unknown>
    }
    expect(url).toBe("/api/route?page=2&token=[Filtered]#ancre")
    expect(query.token).toBe(null)
  })

  it("masque les variantes de nom, quelle que soit la casse ou le séparateur", () => {
    const { url } = serializers.req(fakeRequest({ url: `/api/x?access_token=${FAKE_JWT}&jobToken=${FAKE_JWT}&API_KEY=secret&api-key=secret&api_keyword=seo` })) as {
      url: string
    }
    expect(url).toBe("/api/x?access_token=[Filtered]&jobToken=[Filtered]&API_KEY=[Filtered]&api-key=[Filtered]&api_keyword=seo")
  })

  it("masque dans query les mêmes paramètres que dans url", () => {
    const { url, query } = serializers.req(
      fakeRequest({ url: "/api/x?email=test%40exemple.fr&api_key=secret&page=2", query: { email: "test@exemple.fr", api_key: "secret", page: "2" } })
    ) as { url: string; query: Record<string, unknown> }
    expect(url).toBe("/api/x?email=[Filtered]&api_key=[Filtered]&page=2")
    expect(query).toEqual({ email: "[Filtered]", api_key: "[Filtered]", page: "2" })
  })

  it("ne plante pas sur une clé mal encodée", () => {
    const { url } = serializers.req(fakeRequest({ url: "/api/x?%E0%A4%A=1&token=abc" })) as { url: string }
    expect(url).toBe("/api/x?%E0%A4%A=1&token=[Filtered]")
  })

  it("laisse inchangée une url sans query", () => {
    const { url } = serializers.req(fakeRequest({ url: "/api/healthcheck" })) as { url: string }
    expect(url).toBe("/api/healthcheck")
  })

  it("filtre aussi les params de route", () => {
    const { params } = serializers.req(fakeRequest({ params: { jobId: "abc", token: FAKE_JWT } })) as { params: Record<string, unknown> }
    expect(params).toEqual({ jobId: "abc", token: null })
  })
})

describe("serializers.res", () => {
  it("masque set-cookie et le jeton d'une redirection", () => {
    const res = serializers.res(fakeReply(`/api/login?token=${FAKE_JWT}`, { "set-cookie": `lba_session=${FAKE_JWT}`, location: `/espace-pro?token=${FAKE_JWT}&from=mail` })) as {
      url: string
      headers: Record<string, unknown>
    }
    expect(res.url).toBe("/api/login?token=[Filtered]")
    expect(res.headers["set-cookie"]).toBe(null)
    expect(res.headers.location).toBe("/espace-pro?token=[Filtered]&from=mail")
  })
})
