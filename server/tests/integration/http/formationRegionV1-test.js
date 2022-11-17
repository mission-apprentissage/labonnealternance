import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que la route répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/formationsParRegion")

    assert.strictEqual(response.status, 400)
  })

  /*it("Vérifie que la recherche répond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/V1/formationsParRegion?romes=F1603,I1308&region=01&caller=a");

    assert.strictEqual(response.status, 200);
  });*/

  /*it("Vérifie que la recherche avec Rome et region répond avec des résultats", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/V1/formationsParRegion?romes=F1603,I1308&region=01&caller=a");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.results instanceof Array);
  });*/

  /*it("Vérifie que la recherche avec département répond avec des résultats", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/V1/formationsParRegion?departement=44&caller=a");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.results instanceof Array);
  });*/

  it("Vérifie que les requêtes avec region et departement sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?departement=44&region=01")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("region, departement : You must define either region OR departement, not both.") >= 0)
  })

  it("Vérifie que les requêtes avec departement mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?departement=9745")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf(
        "departement : Badly formatted departement. departement must be a two digit number or three digit number for overseas departments. ex : 01 or 974"
      ) >= 0
    )
  })

  it("Vérifie que les requêtes avec region mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?region=123")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("region : Badly formatted region. region must be a two digit number. ex : 01") >= 0)
  })

  it("Vérifie que les requêtes avec code region hors liste sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?region=07")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("region : Badly formatted region. region must be one of the allowed values as described in the api online doc.") >= 0)
  })

  it("Vérifie que les requêtes avec ROME et domaine ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?romes=F1603,I1308&romeDomain=A20&region=01")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes, romeDomain : You must define either romes OR romeDomain, not both.") >= 0)
  })

  it("Vérifie que les requêtes avec ROME mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?romes=ABCDE&region=01")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234") >= 0)
  })

  it("Vérifie que les requêtes avec trop de ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get(
      "/api/V1/formationsParRegion?romes=ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE&region=01"
    )

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Too many rome codes. Maximum is 20.") >= 0)
  })

  it("Vérifie que les requêtes sans caller sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?romes=F1603,I1308&region=01")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("caller : caller is missing.") >= 0)
  })

  it("Vérifie que les requêtes sans region ou département et sans rome ou domaine rome sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("region, departement, romes, romeDomain : You must assign a value to at least one of these parameters.") >= 0)
  })

  it("Vérifie que les requêtes avec diploma mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formationsParRegion?romes=F1603,I1308&radius=0&longitude=180&latitude=90&diploma=lba,lbc")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf(
        'diploma : Optional diploma argument used with wrong value. Should contains only one of "3xxx","4xxx","5xxx","6xxx","7xxx". xxx maybe any value'
      ) >= 0
    )
  })
})
