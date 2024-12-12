import { IFormationCatalogue, zFormationCatalogueSchema } from "shared/models"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"

useMongo()

describe("formationRegionV1", () => {
  const httpClient = useServer()

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-08-21"))

    return () => {
      vi.useRealTimers()
    }
  })

  let formations: IFormationCatalogue[] = []

  beforeEach(async () => {
    formations = await Promise.all(
      [
        {
          cle_ministere_educatif: "1",
          code_postal: "75006",
          num_departement: "75",
          rome_codes: ["F1603", "F1606"],
          tags: ["2024"],
        },
        {
          cle_ministere_educatif: "2",
          code_postal: "92110",
          num_departement: "92",
          rome_codes: ["F1603"],
          tags: ["2024", "2023"],
        },
        {
          cle_ministere_educatif: "3",
          code_postal: "91000",
          num_departement: "91",
          rome_codes: ["F1603"],
          tags: ["2024", "2023"],
        },
        {
          cle_ministere_educatif: "4",
          code_postal: "77000",
          num_departement: "77",
          rome_codes: ["I1308"],
          tags: ["2024", "2023"],
        },
        {
          cle_ministere_educatif: "5",
          code_postal: "44980",
          num_departement: "44",
          rome_codes: ["N4101"],
          tags: ["2024", "2023"],
        },
        {
          cle_ministere_educatif: "6",
          code_postal: "44983",
          num_departement: "44",
          rome_codes: ["F1603"],
          tags: ["2024", "2023"],
        },
      ].map((data) => saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), data))
    )
  })

  it("Vérifie que la route répond", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion" })

    expect(res.statusCode).toBe(400)
  })

  it("Vérifie que la recherche avec Rome et region répond avec des résultats", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?romes=F1603,I1308&region=11&caller=a" })
    expect.soft(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      results: expect.arrayContaining([
        expect.objectContaining({ cleMinistereEducatif: formations[0].cle_ministere_educatif }),
        expect.objectContaining({ cleMinistereEducatif: formations[1].cle_ministere_educatif }),
        expect.objectContaining({ cleMinistereEducatif: formations[2].cle_ministere_educatif }),
        expect.objectContaining({ cleMinistereEducatif: formations[3].cle_ministere_educatif }),
      ]),
    })
  })

  it("Vérifie que la recherche avec département répond avec des résultats", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?departement=44&caller=a" })

    expect.soft(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      results: expect.arrayContaining([
        expect.objectContaining({ cleMinistereEducatif: formations[4].cle_ministere_educatif }),
        expect.objectContaining({ cleMinistereEducatif: formations[5].cle_ministere_educatif }),
      ]),
    })
  })

  it("Vérifie que les requêtes avec region et departement sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?departement=44&region=01" })
    expect(res.statusCode).toBe(400)

    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("region, departement : You must define either region OR departement, not both.")
  })

  it("Vérifie que les requêtes avec departement mal formé sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?departement=9745" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain(
      "departement : Badly formatted departement. departement must be a two digit number or three digit number for overseas departments. ex : 01 or 974"
    )
  })

  it("Vérifie que les requêtes avec region mal formée sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?region=123" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("region : Badly formatted region. region must be a two digit number. ex : 01")
  })

  it("Vérifie que les requêtes avec code region hors liste sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?region=07" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("region : Badly formatted region. region must be one of the allowed values as described in the api online doc.")
  })

  it("Vérifie que les requêtes avec ROME et domaine ROME sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?romes=F1603,I1308&romeDomain=A20&region=01" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("romes, romeDomain : You must define either romes OR romeDomain, not both.")
  })

  it("Vérifie que les requêtes avec ROME mal formé sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?romes=ABCDE&region=01" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234")
  })

  it("Vérifie que les requêtes avec trop de ROME sont refusées", async () => {
    const res = await httpClient().inject({
      method: "GET",
      path: "/api/V1/formationsParRegion?romes=ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE&region=01",
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("romes : Too many rome codes. Maximum is 20.")
  })

  it("Vérifie que les requêtes sans caller sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?romes=F1603,I1308&region=01" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("caller : caller is missing.")
  })

  it("Vérifie que les requêtes sans region ou département et sans rome ou domaine rome sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("wrong_parameters")
    expect(JSON.parse(res.body).error_messages).toContain("region, departement, romes, romeDomain : You must assign a value to at least one of these parameters.")
  })

  it("Vérifie que les requêtes avec diploma mal formée sont refusées", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?romes=F1603,I1308&radius=0&longitude=180&latitude=90&diploma=lba,lbc" })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toEqual("Bad Request")
    expect(JSON.parse(res.body).message).toContain("querystring.diploma: Invalid enum value.")
  })
})
