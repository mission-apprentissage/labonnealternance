import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it } from "vitest"

// Skip from CI (ES is not populated correctly)
describe.skipIf(process.env.CI)("formationRegionV1", () => {
  useMongo()
  const httpClient = useServer()

  it("Vérifie que la route répond", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion" })

    expect(res.statusCode).toBe(400)
  })

  it("Vérifie que la recherche avec Rome et region répond avec des résultats", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?romes=F1603,I1308&region=11&caller=a" })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).results).not.toHaveLength(0)
  })

  it("Vérifie que la recherche avec département répond avec des résultats", async () => {
    const res = await httpClient().inject({ method: "GET", path: "/api/V1/formationsParRegion?departement=44&caller=a" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).results).not.toHaveLength(0)
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
