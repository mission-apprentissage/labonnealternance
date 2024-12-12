import assert from "assert"

import { describe, expect, it } from "vitest"

import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

describe("rolesRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it.skip("Vérifie qu'on peut se connecter à une route sécurisée en tant qu'administrateur", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const response = await httpClient().inject({ method: "GET", path: "/api/authentified", headers: bearerToken })
    expect(response.statusCode).toBe(200)
  })

  it("Vérifie qu'on peut se connecter à une route d'admin en tant qu'administrateur", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const response = await httpClient().inject({ method: "GET", path: "/api/admin/formations?search_item=test", headers: bearerToken })
    expect(response.statusCode).toBe(200)
  })

  it.skip("Vérifie qu'on peut se connecter à une route sécurisée en tant que cfa", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })
    const response = await httpClient().inject({ method: "GET", path: "/api/authentified", headers: bearerToken })
    expect(response.statusCode).toBe(200)
  })

  it("Vérifie qu'on ne peut pas se connecter à une route d'admin en tant que cfa", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })
    const response = await httpClient().inject({ method: "GET", path: "/api/admin/appointments/details", headers: bearerToken })
    assert.notStrictEqual(response.statusCode, 200)
  })
})
