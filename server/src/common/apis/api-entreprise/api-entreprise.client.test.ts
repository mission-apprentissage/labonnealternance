import nock from "nock"
import { describe, expect, it, vi } from "vitest"

import { sentryCaptureException } from "@/common/utils/sentry-utils"

import { getEtablissementFromGouvSafe, getEtatAdministratifFromGouv, NO_RESPONSE_REASON } from "./api-entreprise.client"
import { apiEntrepriseEtablissementFixture } from "./api-entreprise.client.fixture"

vi.mock("@/common/utils/sentry-utils")

const siret = apiEntrepriseEtablissementFixture.dinum.data.siret

const nockApiEntreprise = (status: number, body: nock.Body = {}, headers: Record<string, string> = {}) =>
  nock("https://entreprise.api.gouv.fr/v3/insee/")
    .get(`/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`)
    .query({
      token: "LBA_ENTREPRISE_API_KEY",
      context: "mission-apprentissage",
      recipient: "12000101100010",
      object: "consolidation",
    })
    .reply(status, body, headers)

describe("getEtablissementFromGouvSafe", () => {
  it("should return data from API entreprise", async () => {
    const result = apiEntrepriseEtablissementFixture.dinum
    nockApiEntreprise(200, result)

    await expect(getEtablissementFromGouvSafe(siret)).resolves.toEqual(result)
    expect(nock.isDone()).toBe(true)
  })

  it.each([502, 503, 504])("should return null and capture in Sentry on %i response", async (status) => {
    nockApiEntreprise(status)

    await expect(getEtablissementFromGouvSafe(siret)).resolves.toBeNull()
    expect(nock.isDone()).toBe(true)
    expect(sentryCaptureException).toHaveBeenCalledTimes(1)
  })
})

describe("getEtatAdministratifFromGouv", () => {
  const RESET = 1795526460

  it("renvoie l'état administratif et le quota restant lu dans les headers RateLimit", async () => {
    nockApiEntreprise(200, apiEntrepriseEtablissementFixture.dinum, { "RateLimit-Limit": "250", "RateLimit-Remaining": "249", "RateLimit-Reset": String(RESET) })

    await expect(getEtatAdministratifFromGouv(siret)).resolves.toEqual({
      result: { kind: "found", etat: "A", dateFermeture: null },
      rateLimit: { remaining: 249, resetAt: new Date(RESET * 1000) },
    })
  })

  it("convertit la date de fermeture, en secondes Unix", async () => {
    const closed = { ...apiEntrepriseEtablissementFixture.dinum, data: { ...apiEntrepriseEtablissementFixture.dinum.data, etat_administratif: "F", date_fermeture: 1719705600 } }
    nockApiEntreprise(200, closed)

    await expect(getEtatAdministratifFromGouv(siret)).resolves.toMatchObject({ result: { kind: "found", etat: "F", dateFermeture: new Date("2024-06-30T00:00:00.000Z") } })
  })

  it("remonte le 429 avec le délai Retry-After", async () => {
    nockApiEntreprise(429, {}, { "Retry-After": "17", "RateLimit-Remaining": "0", "RateLimit-Reset": String(RESET) })

    await expect(getEtatAdministratifFromGouv(siret)).resolves.toEqual({
      result: { kind: "rate_limited", retryAfterMs: 17_000 },
      rateLimit: { remaining: 0, resetAt: new Date(RESET * 1000) },
    })
  })

  it.each([
    [404, false],
    [422, false],
    [451, false],
    [502, true],
    [503, true],
  ])("ne conclut rien sur un %i (erreur technique : %s)", async (status, technical) => {
    nockApiEntreprise(status)

    await expect(getEtatAdministratifFromGouv(siret)).resolves.toMatchObject({ result: { kind: "unknown", reason: `HTTP ${status}`, technical } })
  })

  it("ne conclut rien sur une réponse 200 sans état administratif", async () => {
    nockApiEntreprise(200, { data: { siret } })

    await expect(getEtatAdministratifFromGouv(siret)).resolves.toMatchObject({ result: { kind: "unknown", technical: false } })
  })

  it("distingue l'absence de réponse, signe possible d'un bannissement de l'IP", async () => {
    nock("https://entreprise.api.gouv.fr/v3/insee/")
      .get(`/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`)
      .query(true)
      .replyWithError("socket hang up")

    await expect(getEtatAdministratifFromGouv(siret)).resolves.toMatchObject({ result: { kind: "unknown", reason: NO_RESPONSE_REASON, technical: true } })
  })
})
