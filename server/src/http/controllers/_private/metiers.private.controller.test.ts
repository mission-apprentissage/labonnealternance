import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const mockData = async () => {
  await getDbCollection("referentielromes").insertOne(
    generateReferentielRome({
      couple_appellation_rome: [{ code_rome: "D1102", intitule: "Boulangerie - viennoiserie", appellation: "Boulanger / Boulangère" }],
    })
  )
}

describe("GET /_private/metiers/intitule", () => {
  useMongo(mockData)
  const httpClient = useServer()

  it("répond 400 sans paramètre label", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/_private/metiers/intitule" })

    expect(response.statusCode).toBe(400)
  })

  it("retourne les appellations correspondant au label", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/_private/metiers/intitule?label=boulanger" })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.coupleAppellationRomeMetier).toEqual([{ code_rome: "D1102", intitule: "Boulangerie - viennoiserie", appellation: "Boulanger / Boulangère" }])
  })

  it("répond 200 avec une liste vide quand aucun métier ne correspond", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/_private/metiers/intitule?label=zzzzzzzz" })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ coupleAppellationRomeMetier: [] })
  })
})
