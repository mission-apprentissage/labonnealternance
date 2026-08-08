import nock from "nock"
import { describe, expect, it, vi } from "vitest"

import { sentryCaptureException } from "@/common/utils/sentry-utils"

import { getEtablissementFromGouvSafe } from "./api-entreprise.client"
import { apiEntrepriseEtablissementFixture } from "./api-entreprise.client.fixture"

vi.mock("@/common/utils/sentry-utils")

const siret = apiEntrepriseEtablissementFixture.dinum.data.siret

const nockApiEntreprise = (status: number, body: nock.Body = {}) =>
  nock("https://entreprise.api.gouv.fr/v3/insee/")
    .get(`/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`)
    .query({
      token: "LBA_ENTREPRISE_API_KEY",
      context: "mission-apprentissage",
      recipient: "12000101100010",
      object: "consolidation",
    })
    .reply(status, body)

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
