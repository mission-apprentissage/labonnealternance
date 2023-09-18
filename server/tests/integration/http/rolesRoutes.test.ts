import assert from "assert"
import { ROLES } from "../../../src/services/constant.service"
import { describe, it, expect } from "vitest"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"
import { createAndLogUser } from "@tests/utils/login.utils"

describe("rolesRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it.skip("Vérifie qu'on peut se connecter à une route sécurisée en tant qu'administrateur", async () => {
    const bearerToken = await createAndLogUser(httpClient, "userAdmin", "password", { role: ROLES.administrator })

    const response = await httpClient().get("/api/authentified").set(bearerToken)
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie qu'on peut se connecter à une route d'admin en tant qu'administrateur", async () => {
    const bearerToken = await createAndLogUser(httpClient, "userAdmin", "password", { role: ROLES.administrator })

    const response = await httpClient().get("/api/admin").set(bearerToken)
    assert.strictEqual(response.status, 200)
  })

  it.skip("Vérifie qu'on peut se connecter à une route sécurisée en tant que candidat", async () => {
    const bearerToken = await createAndLogUser(httpClient, "userCandidat", "password", { role: ROLES.candidat })

    const response = await httpClient().get("/api/authentified").set(bearerToken)
    assert.strictEqual(response.status, 200)
  })

  it.skip("Vérifie qu'on ne peut pas se connecter à une route d'admin en tant que candidat", async () => {
    const bearerToken = await createAndLogUser(httpClient, "userCandidat", "password", { role: ROLES.candidat })

    const response = await httpClient().get("/api/admin").set(bearerToken)
    assert.notStrictEqual(response.status, 200)
  })

  it.skip("Vérifie qu'on peut se connecter à une route sécurisée en tant que cfa", async () => {
    const bearerToken = await createAndLogUser(httpClient, "userCfa", "password", { role: ROLES.cfa })

    const response = await httpClient().get("/api/authentified").set(bearerToken)
    assert.strictEqual(response.status, 200)
  })

  it.skip("Vérifie qu'on ne peut pas se connecter à une route d'admin en tant que cfa", async () => {
    const bearerToken = await createAndLogUser(httpClient, "userCfa", "password", { role: ROLES.cfa })

    const response = await httpClient().get("/api/admin").set(bearerToken)
    assert.notStrictEqual(response.status, 200)
  })
})
