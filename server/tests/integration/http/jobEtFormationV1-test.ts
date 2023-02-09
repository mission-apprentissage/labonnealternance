import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que la route répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/V1/jobsEtFormations")

    assert.strictEqual(response.status, 400)
  })

  /*it("Vérifie que la recherche répond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056&caller=a"
    );

    assert.strictEqual(response.status, 200);
  });*/

  /*it("Vérifie que la recherche répond avec des résultats", async () => {
    console.log("entering...");

    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056&caller=a"
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.formations.results instanceof Array);
    assert.ok(response.data.jobs.matchas.results instanceof Array);
    assert.strictEqual(response.data.jobs.peJobs.status, 401);
    assert.strictEqual(response.data.jobs.lbaCompanies.status, 401);
  });*/

  /*it("Vérifie que la recherche répond avec des résultats", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(
      "/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056&sources=lba&caller=a"
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.formations === null);
    assert.ok(response.data.jobs.peJobs === null);
    //assert.ok(response.data.jobs.lbaCompanies.results instanceof Array);
    assert.strictEqual(response.data.jobs.lbaCompanies.status, 401);
    assert.ok(response.data.jobs.lbbCompanies === null);
  });*/

  it("Vérifie que les requêtes sans ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=&longitude=2.3752&latitude=48.845&radius=30&insee=75056")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Rome codes are missing. At least 1.") >= 0)
  })

  it("Vérifie que les requêtes avec ROME mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=ABCDE&longitude=2.3752&latitude=48.845&radius=30&insee=75056")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234") >= 0)
  })

  it("Vérifie que les requêtes avec trop de ROME sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get(
      "/api/V1/jobsEtFormations?romes=ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE&longitude=2.3752&latitude=48.845&radius=30&insee=75056"
    )

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("romes : Too many rome codes. Maximum is 15.") >= 0)
  })

  it("Vérifie que les requêtes sans caller sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=75056")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("caller : caller is missing.") >= 0)
  })

  it("Vérifie que les requêtes sans code insee sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("insee : insee city code is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec code insee mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&insee=ABCDE")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("insee : Badly formatted insee city code. Must be 5 digit number.") >= 0)
  })

  it("Vérifie que les requêtes sans radius sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec radius mal formé sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=XX&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec radius hors limite sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=201&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("radius : Search radius must be a number between 0 and 200.") >= 0)
  })

  it("Vérifie que les requêtes sans latitude sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec latitude mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=AX&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec latitude hors limites sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=91&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("latitude : Search center latitude must be a number between -90 and 90.") >= 0)
  })

  it("Vérifie que les requêtes sans longitude sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=&latitude=2.3752&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude is missing.") >= 0)
  })

  it("Vérifie que les requêtes avec longitude mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=AX&latitude=2.3752&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude must be a number.") >= 0)
  })

  it("Vérifie que les requêtes avec longitude hors limites sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=181&latitude=90&insee=12345")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(response.data.error_messages.indexOf("longitude : Search center longitude must be a number between -180 and 180.") >= 0)
  })

  it("Vérifie que les requêtes avec sources mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=180&latitude=90&insee=12345&sources=lba,lbc")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf(
        "sources : Optional sources argument used with wrong value. Should contains comma separated values among 'formations', 'lbb', 'lba', 'offres', 'matcha'."
      ) >= 0
    )
  })

  it("Vérifie que les requêtes avec diploma mal formée sont refusées", async () => {
    const { httpClient } = await startServer()

    let response = await httpClient.get("/api/V1/jobsEtFormations?romes=F1603,I1308&radius=0&longitude=180&latitude=90&diploma=lba,lbc")

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data.error, "wrong_parameters")
    assert.ok(
      response.data.error_messages.indexOf(
        'diploma : Optional diploma argument used with wrong value. Should contains only one of "3xxx","4xxx","5xxx","6xxx","7xxx". xxx maybe any value'
      ) >= 0
    )
  })
})
