import assert from "assert"
import __filename from "../../../src/common/filename.js"
import httpTests from "../../utils/httpTests.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que la route répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobs")

    assert.strictEqual(response.status, 400)
  })

  it("Vérifie que la recherche répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056&caller=a")

    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que la recherche répond avec des résultats", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=2B003&caller=a")

    assert.strictEqual(response.status, 200)
    /*assert.ok(response.data.peJobs.results instanceof Array);
    assert.ok(response.data.lbaCompanies.results instanceof Array);
    assert.ok(response.data.lbbCompanies.results instanceof Array);*/
    assert.strictEqual(response.data.peJobs.status, 401)
    //assert.ok(response.data.lbaCompanies.results instanceof Array);
    assert.ok(response.data.matchas.results instanceof Array)
  })

  it("Vérifie que les requêtes sans ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=&longitude=2.3752&latitude=48.845&radius=30&insee=75056")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Rome codes are missing. At least 1.") >= 0)
  })

  it("Vérifie que les requêtes avec ROME mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=ABCDE&longitude=2.3752&latitude=48.845&radius=30&insee=75056")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234") >= 0)
  })

  it("Vérifie que les requêtes avec trop de ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get(
      "/api/V1/jobs?romes=ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE&longitude=2.3752&latitude=48.845&radius=30&insee=75056"
    )

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Too many rome codes. Maximum is 15.") >= 0)
  })

  it("Vérifie que les requêtes sans caller sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("caller : caller is missing.") >= 0)
  })

  it("Vérifie que les requêtes sans code insee sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&caller=a&insee=")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("insee : insee city code is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec code insee mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&caller=a&insee=ABCDE")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("insee : Badly formatted insee city code. Must be 5 digit number.") >= 0)
  })

  it("Vérifie que les requêtes sans radius sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec radius mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=XX&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec radius hors limite sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=201&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius must be a number between 0 and 200.") >= 0)
  })

  it("Vérifie que les requêtes sans latitude sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec latitude mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=AX&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec latitude hors limites sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=91&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude must be a number between -90 and 90.") >= 0)
  })

  it("Vérifie que les requêtes sans longitude sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=&latitude=2.3752&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec longitude mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=AX&latitude=2.3752&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec longitude hors limites sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=181&latitude=90&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude must be a number between -180 and 180.") >= 0)
  })

  it("Vérifie que les requêtes avec sources mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobs?romes=F1603,I1308&radius=0&longitude=180&latitude=90&insee=12345&sources=lba,lbc")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf(
        "sources : Optional sources argument used with wrong value. Should contains comma separated values among 'lbb', 'lba', 'offres', 'matcha'."
      ) >= 0
    )
  })

  it("Vérifie que la route offre PE par id répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobs/job/110MSJT")

    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que la route lBB par siret répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobs/company/84384222000017?type=lbb")

    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que la route lBA par siret répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobs/company/84384222000017?type=lba")

    assert.strictEqual(response.status, 200)
  })
})
