import assert from "assert"

import { describe, expect, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

describe("formationV1", () => {
  useMongo()
  const httpClient = useServer()

  it("Vérifie que la route formations répond", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations" })

    expect(response.statusCode).toBe(400)
  })

  /*it("Vérifie que la recherche répond", async () => {
 ;

    const response = await httpClient().get({ method: 'GET', path: 
      "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    expect(response.statusCode).toBe(200);
  });*/

  /*it("Vérifie que la recherche avec Rome répond avec des résultats", async () => {
 ;

    const response = await httpClient().get({ method: 'GET', path: 
      "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    expect(response.statusCode).toBe(200);
    assert.ok(response.body.results instanceof );
  });*/

  /*it("Vérifie que la recherche avec Domaine rome répond avec des résultats", async () => {
 ;

    const response = await httpClient().get({ method: 'GET', path: 
      "/api/V1/formations?romeDomain=F16&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    expect(response.statusCode).toBe(200);
    assert.ok(response.body.results instanceof );
  });*/

  /*it("Vérifie que la recherche avec grand Domaine rome répond avec des résultats", async () => {
 ;

    const response = await httpClient().get({ method: 'GET', path: 
      "/api/V1/formations?romeDomain=F&longitude=2.3752&latitude=48.845&radius=30&caller=a"
    );

    expect(response.statusCode).toBe(200);
    assert.ok(response.body.results instanceof );
  });*/

  it.skip("Vérifie que les requêtes sans ROME et sans domaine ROME sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?longitude=2.3752&latitude=48.845&radius=30" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({})
    assert.ok(JSON.parse(response.body).error_messages.indexOf("romes, romeDomain : You must define at least 1 rome code OR a single romeDomain.") >= 0)
  })

  it.skip("Vérifie que les requêtes avec ROME et domaine ROME sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&romeDomain=A20&longitude=2.3752&latitude=48.845&radius=30" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({})
    assert.ok(JSON.parse(response.body).error_messages.indexOf("romes, romeDomain : You must define either romes OR romeDomain, not both.") >= 0)
  })

  it("Vérifie que les requêtes avec domaine ROME mal formé sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romeDomain=ABC&longitude=2.3752&latitude=48.845&radius=30&caller=test" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["romeDomain : Badly formatted romeDomain. Rome domain must be one letter or one letter followed by 2 digit number. ex : A or A12"],
    })
    assert.ok(
      JSON.parse(response.body).error_messages.indexOf(
        "romeDomain : Badly formatted romeDomain. Rome domain must be one letter or one letter followed by 2 digit number. ex : A or A12"
      ) >= 0
    )
  })

  it("Vérifie que les requêtes avec ROME mal formé sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=ABCDE&longitude=2.3752&latitude=48.845&radius=30&caller=test" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234"],
    })
    assert.ok(JSON.parse(response.body).error_messages.indexOf("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234") >= 0)
  })

  it("Vérifie que les requêtes avec trop de ROME sont refusées", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: "/api/V1/formations?romes=ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE,ABCDE&longitude=2.3752&latitude=48.845&radius=30&caller=test",
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["romes : Too many rome codes. Maximum is 20.", "romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234"],
    })
  })

  it("Vérifie que les requêtes sans caller sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["caller : caller is missing."],
    })
  })

  it("Vérifie que les requêtes avec radius mal formé sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=XX" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "invalid_type",
              expected: "number",
              message: "Expected number, received nan",
              path: ["radius"],
              received: "nan",
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "querystring",
        },
      },
      error: "Bad Request",
      message: "querystring.radius: Expected number, received nan",
      statusCode: 400,
    })
  })

  it("Vérifie que les requêtes avec radius hors limite sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&longitude=2.3752&latitude=48.845&radius=201&caller=test" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["radius : Search radius must be a number between 0 and 200."],
    })
  })

  it("Vérifie que les requêtes avec latitude mal formée sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=AX" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "invalid_type",
              expected: "number",
              message: "Expected number, received nan",
              path: ["latitude"],
              received: "nan",
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "querystring",
        },
      },
      error: "Bad Request",
      message: "querystring.latitude: Expected number, received nan",
      statusCode: 400,
    })
  })

  it("Vérifie que les requêtes avec latitude hors limites sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&radius=0&longitude=2.3752&latitude=91&caller=test" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["latitude : Search center latitude must be a number between -90 and 90."],
    })
  })

  it("Vérifie que les requêtes avec longitude mal formée sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&radius=0&longitude=AX&latitude=2.3752" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      data: {
        validationError: {
          code: "FST_ERR_VALIDATION",
          issues: [
            {
              code: "invalid_type",
              expected: "number",
              message: "Expected number, received nan",
              path: ["longitude"],
              received: "nan",
            },
          ],
          name: "ZodError",
          statusCode: 400,
          validationContext: "querystring",
        },
      },
      error: "Bad Request",
      message: "querystring.longitude: Expected number, received nan",
      statusCode: 400,
    })
  })

  it("Vérifie que les requêtes avec longitude hors limites sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&radius=0&longitude=181&latitude=90" })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: "wrong_parameters",
      error_messages: ["caller : caller is missing.", "longitude : Search center longitude must be a number between -180 and 180."],
    })
  })

  it("Vérifie que les requêtes avec diploma mal formée sont refusées", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/V1/formations?romes=F1603,I1308&radius=0&longitude=180&latitude=90&diploma=lba,lbc" })

    expect(response.statusCode).toBe(400)
    assert.ok(JSON.parse(response.body).data.validationError.code === "FST_ERR_VALIDATION")
  })
})
