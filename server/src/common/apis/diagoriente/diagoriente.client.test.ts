import nock from "nock"
import { describe, expect, it, vi } from "vitest"

import { getDiagorienteRomeClassification } from "@/common/apis/diagoriente/diagoriente.client"
import { nockDiagorienteAccessToken, nockDiagorienteRomeClassifier } from "@/common/apis/diagoriente/diagoriente.client.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"

useMongo()

vi.mock("@/common/utils/sentryUtils")

describe("getDiagorienteRomeClassifierPredictions", () => {
  const payload = [{ title: "Software Engineer", id: "1", sector: "sector", description: "Software Engineer" }]
  const response = [{ job_offer_id: "1", code_rome: "M1855", intitule_rome: "Développeur / Développeuse web" }]

  it("should request diagoriente predictions", async () => {
    nockDiagorienteAccessToken()
    nockDiagorienteRomeClassifier(payload, response)

    expect(await getDiagorienteRomeClassification(payload)).toEqual(response)
    expect(nock.isDone()).toBe(true)
  })

  it("should throw an error if the payload is too big", async () => {
    const payload = Array.from({ length: 51 }, (_, i) => ({ title: `Software Engineer ${i}`, id: `${i}`, sector: "sector", description: "Software Engineer" }))
    await expect(getDiagorienteRomeClassification(payload)).rejects.toThrowError("Trop de données à envoyer à l'API Diagoriente, limiter la requête à 10 éléments")
  })
})
