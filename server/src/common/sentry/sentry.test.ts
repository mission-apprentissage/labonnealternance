import type * as Sentry from "@sentry/node"
import * as SentryNode from "@sentry/node"
import axios from "axios"
import FormData from "form-data"
import nock from "nock"
import { afterEach, describe, expect, it } from "vitest"

import { scrubSensitiveEventData } from "./sentry"

/**
 * Reproduit exactement l'étape qui sérialise l'AxiosError dans `event.contexts` en production
 * (`extraErrorDataIntegration`, cf. sentry.ts) sur une vraie erreur axios/nock, plutôt que sur un
 * fixture écrit à la main : un fixture peut, par construction, ne pas reproduire les propriétés
 * internes (ClientRequest brut, buffers `form-data`) qui portent réellement le secret en prod.
 */
async function captureRealAxiosError(makeRequest: () => Promise<unknown>): Promise<Sentry.ErrorEvent> {
  try {
    await makeRequest()
    throw new Error("expected the request to fail")
  } catch (error) {
    const integration = SentryNode.extraErrorDataIntegration({ depth: 16 })
    const event = { exception: { values: [{ type: "AxiosError", value: (error as Error).message }] } } as Sentry.ErrorEvent
    return integration.processEvent!(event, { originalException: error }, { getOptions: () => ({}) } as never) as Sentry.ErrorEvent
  }
}

describe("scrubSensitiveEventData", () => {
  it("redacts an Authorization Bearer header nested under contexts (extraErrorDataIntegration shape for an AxiosError)", () => {
    const event = {
      contexts: {
        AxiosError: {
          config: {
            url: "https://francetravail.io/offres/search",
            headers: { Authorization: "Bearer secret-access-token", Accept: "application/json" },
            params: { token: "LBA_ENTREPRISE_API_KEY" },
            data: "grant_type=client_credentials&client_id=abc&client_secret=super-secret",
          },
          response: { status: 500, data: { message: "erreur" } },
        },
      },
    } as unknown as Sentry.ErrorEvent

    const scrubbed = scrubSensitiveEventData(event)

    expect(scrubbed.contexts?.AxiosError).toMatchObject({
      config: {
        url: "https://francetravail.io/offres/search",
        headers: { Authorization: "[Filtered]", Accept: "application/json" },
        params: { token: "[Filtered]" },
        data: "grant_type=client_credentials&client_id=abc&client_secret=[Filtered]",
      },
      response: { status: 500, data: { message: "erreur" } },
    })
  })

  it("redacts a Bearer token embedded inside a plain string (not just under a matching key)", () => {
    const event = {
      extra: { curlCommand: `curl -H "Authorization: Bearer abc.def-ghi_123" https://example.com` },
    } as unknown as Sentry.ErrorEvent

    const scrubbed = scrubSensitiveEventData(event)

    expect(scrubbed.extra).toEqual({ curlCommand: `curl -H "Authorization: Bearer [Filtered]" https://example.com` })
  })

  it("redacts sensitive keys in extra and request without touching unrelated data", () => {
    const event = {
      extra: { url: "https://example.com", client_secret: "abc", nested: { apiKey: "xyz", status: 429 } },
      request: { headers: { cookie: "session=1", "x-omogen-api-key": "key", "content-type": "application/json" } },
    } as unknown as Sentry.ErrorEvent

    const scrubbed = scrubSensitiveEventData(event)

    expect(scrubbed.extra).toEqual({ url: "https://example.com", client_secret: "[Filtered]", nested: { apiKey: "[Filtered]", status: 429 } })
    expect(scrubbed.request?.headers).toEqual({ cookie: "[Filtered]", "x-omogen-api-key": "[Filtered]", "content-type": "application/json" })
  })

  it("does not throw on a circular reference", () => {
    const circular: Record<string, unknown> = { secret: "abc" }
    circular.self = circular
    const event = { extra: circular } as unknown as Sentry.ErrorEvent

    expect(() => scrubSensitiveEventData(event)).not.toThrow()
    expect((event.extra as { secret: string }).secret).toBe("[Filtered]")
  })

  it("leaves an event without contexts/extra/request untouched", () => {
    const event = { message: "plain error" } as unknown as Sentry.ErrorEvent

    expect(scrubSensitiveEventData(event)).toEqual({ message: "plain error" })
  })
})

// Régression : ces cas passaient tous la version précédente du scrub (clé/valeur sur objets +
// motif `clé=valeur` limité à quelques noms de clé), le secret fuitait via des propriétés que le
// scrub par nom de clé ne visite pas nativement — cf. AxiosError.request (le ClientRequest Node
// brut) et AxiosError.config.data quand c'est une instance form-data (le nom du champ et sa valeur
// sont dans deux entrées de tableau `_streams` distinctes, pas dans une seule string `clé=valeur`).
describe("scrubSensitiveEventData — régression sur de vraies AxiosError (axios + nock + @sentry/node)", () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it("ne laisse pas fuiter un secret transmis en query param, y compris via le ClientRequest Node brut (config.params ET request._header/path)", async () => {
    nock("http://fake-api-entreprise.test").get("/etablissements/123").query({ token: "LBA_ENTREPRISE_API_KEY_SECRET" }).reply(500, {})

    const event = await captureRealAxiosError(() => axios.get("http://fake-api-entreprise.test/etablissements/123", { params: { token: "LBA_ENTREPRISE_API_KEY_SECRET" } }))

    expect(JSON.stringify(scrubSensitiveEventData(event))).not.toContain("LBA_ENTREPRISE_API_KEY_SECRET")
  })

  it("ne laisse pas fuiter un login/password transmis en corps multipart (form-data), y compris via les buffers internes _streams", async () => {
    nock("http://fake-ft.test").post("/depot").reply(500, "erreur serveur")
    const form = new FormData()
    form.append("login", "MON_LOGIN_SECRET")
    form.append("password", "MON_PASSWORD_SECRET")

    const event = await captureRealAxiosError(() => axios.post("http://fake-ft.test/depot", form, { headers: form.getHeaders() }))

    const json = JSON.stringify(scrubSensitiveEventData(event))
    expect(json).not.toContain("MON_LOGIN_SECRET")
    expect(json).not.toContain("MON_PASSWORD_SECRET")
  })

  it("ne laisse pas fuiter un Authorization Bearer envoyé en en-tête", async () => {
    nock("http://fake-bearer.test").get("/y").reply(500, {})

    const event = await captureRealAxiosError(() => axios.get("http://fake-bearer.test/y", { headers: { Authorization: "Bearer super-secret-bearer-token" } }))

    expect(JSON.stringify(scrubSensitiveEventData(event))).not.toContain("super-secret-bearer-token")
  })

  it("ne laisse pas fuiter un client_secret transmis en corps urlencoded", async () => {
    nock("http://fake-token.test").post("/token").reply(500, {})

    const event = await captureRealAxiosError(() =>
      axios.post("http://fake-token.test/token", "grant_type=client_credentials&client_secret=super-secret-cs", {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    )

    expect(JSON.stringify(scrubSensitiveEventData(event))).not.toContain("super-secret-cs")
  })

  it("préserve le corps de réponse (non sensible) utile au diagnostic", async () => {
    nock("http://fake-diag.test").get("/z").reply(422, { message: "siret invalide" })

    const event = await captureRealAxiosError(() => axios.get("http://fake-diag.test/z"))

    expect(JSON.stringify(scrubSensitiveEventData(event))).toContain("siret invalide")
  })
})
