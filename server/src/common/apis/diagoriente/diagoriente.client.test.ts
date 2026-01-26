import nock from "nock"
import { describe, expect, it, vi } from "vitest"

import type { IDiagorienteClassificationResponseSchema } from "shared"
import { getDiagorienteRomeClassification } from "./diagoriente.client"
import { nockDiagorienteAccessToken, nockDiagorienteRomeClassifier } from "./diagoriente.client.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"

useMongo()

vi.mock("@/common/utils/sentryUtils")

describe("getDiagorienteRomeClassifierPredictions", () => {
  const payload = [{ title: "Software Engineer", id: "1", sector: "sector", description: "Software Engineer" }]
  const response: IDiagorienteClassificationResponseSchema = {
    "1": {
      classify_results: [
        {
          data: {
            _key: "key",
            item_version_id: "version_id",
            item_id: "item_id",
            titre: "Développeur / Développeuse web",
            valid_from: "2024-01-01",
            rome: "M1855",
            valid_to: null,
            item_type: "SousDomaine",
          },
        },
      ],
    },
  }

  it("should request diagoriente predictions", async () => {
    nockDiagorienteAccessToken()
    nockDiagorienteRomeClassifier(payload, response)

    expect(await getDiagorienteRomeClassification(payload)).toEqual(response)
    expect(nock.isDone()).toBe(true)
  })

  it("should throw an error if the payload is too big", async () => {
    const payload = Array.from({ length: 101 }, (_, i) => ({ title: `Software Engineer ${i}`, id: `${i}`, sector: "sector", description: "Software Engineer" }))
    await expect(getDiagorienteRomeClassification(payload)).rejects.toThrowError("Trop de données à envoyer à l'API Diagoriente, limiter la requête à 100 éléments")
  })
})
