import nock from "nock"
import { describe, expect, it } from "vitest"

import { getEtablissementFromGouvSafe } from "./apiEntreprise.client"
import { apiEntrepriseEtablissementFixture } from "./apiEntreprise.client.fixture"

describe("getEtablissementFromGouvSafe", () => {
  it("should return data from API entreprise", async () => {
    const result = apiEntrepriseEtablissementFixture.dinum
    nock("https://entreprise.api.gouv.fr/v3/insee/")
      .get(`/sirene/etablissements/diffusibles/${encodeURIComponent(result.data.siret)}`)
      .query({
        token: "LBA_ENTREPRISE_API_KEY",
        context: "mission-apprentissage",
        recipient: "12000101100010",
        object: "consolidation",
      })
      .reply(200, result)

    await expect(getEtablissementFromGouvSafe(result.data.siret)).resolves.toEqual(result)
    expect(nock.isDone()).toBe(true)
  })
})
