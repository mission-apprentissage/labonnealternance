import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que la route formations répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/formations")

    assert.strictEqual(response.status, 400)
  })

  /*it("Vérifie que la recherche répond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    assert.strictEqual(response.status, 200);
  });*/

  /*it("Vérifie que la recherche avec Rome répond avec des résultats", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.results instanceof Array);
  });*/

  /*it("Vérifie que la recherche avec Domaine rome répond avec des résultats", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/formations?romeDomain=F16&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.results instanceof Array);
  });*/

  /*it("Vérifie que la recherche avec grand Domaine rome répond avec des résultats", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/formations?romeDomain=F&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.results instanceof Array);
  });*/

  it("Vérifie que les requêtes sans ROME et sans domaine ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?longitude=2.3752&latitude=48.845&radius=30")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes, romeDomain : You must define at least 1 rome code OR a single romeDomain.") >= 0)
  })

  it("Vérifie que les requêtes avec ROME et domaine ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&romeDomain=A20&longitude=2.3752&latitude=48.845&radius=30")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes, romeDomain : You must define either romes OR romeDomain, not both.") >= 0)
  })

  it("Vérifie que les requêtes avec domaine ROME mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romeDomain=ABC&longitude=2.3752&latitude=48.845&radius=30")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf("romeDomain : Badly formatted romeDomain. Rome domain must be one letter or one letter followed by 2 digit number. ex : A or A12") >= 0
    )
  })

  it("Vérifie que les requêtes avec ROME mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=ABCDE&longitude=2.3752&latitude=48.845&radius=30")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234") >= 0)
  })

  it("Vérifie que les requêtes avec trop de ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get(
      "/api/V1/formations?romes=ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE&longitude=2.3752&latitude=48.845&radius=30"
    )

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Too many rome codes. Maximum is 20.") >= 0)
  })

  it("Vérifie que les requêtes sans caller sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("caller : caller is missing.") >= 0)
  })

  it("Vérifie que les requêtes sans radius sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec radius mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=XX&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec radius hors limite sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=201&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius must be a number between 0 and 200.") >= 0)
  })

  it("Vérifie que les requêtes sans latitude sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec latitude mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=AX&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec latitude hors limites sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=91&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude must be a number between -90 and 90.") >= 0)
  })

  it("Vérifie que les requêtes sans longitude sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=&latitude=2.3752&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec longitude mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=AX&latitude=2.3752&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec longitude hors limites sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=181&latitude=90&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude must be a number between -180 and 180.") >= 0)
  })

  it("Vérifie que les requêtes avec diploma mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/formations?romes=F1603,I1308&radius=0&longitude=180&latitude=90&diploma=lba,lbc")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf(
        'diploma : Optional diploma argument used with wrong value. Should contains only one of "3xxx","4xxx","5xxx","6xxx","7xxx". xxx maybe any value'
      ) >= 0
    )
  })

  /*it("Vérifie que la route formation répond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/V1/formations/formation/a");

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.results.length === 0);
  });*/

  /*it("Vérifie que la recherche formation répond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/V1/formations/formation/5fd25112c67da3c3e6bc7ef0");

    assert.strictEqual(response.status, 200);
  });*/
})
