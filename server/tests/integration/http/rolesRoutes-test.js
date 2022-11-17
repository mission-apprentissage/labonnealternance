import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import { roles } from "../../../src/common/roles.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie qu'on peut se connecter à une route sécurisée en tant qu'administrateur", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })

    const response = await httpClient.get("/api/authentified", { headers: bearerToken })
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie qu'on peut se connecter à une route d'admin en tant qu'administrateur", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userAdmin", "password", { role: roles.administrator })

    const response = await httpClient.get("/api/admin", { headers: bearerToken })
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie qu'on peut se connecter à une route sécurisée en tant que candidat", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userCandidat", "password", { role: roles.candidat })

    const response = await httpClient.get("/api/authentified", { headers: bearerToken })
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie qu'on ne peut pas se connecter à une route d'admin en tant que candidat", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userCandidat", "password", { role: roles.candidat })

    const response = await httpClient.get("/api/admin", { headers: bearerToken })
    assert.notStrictEqual(response.status, 200)
  })

  it("Vérifie qu'on peut se connecter à une route sécurisée en tant que cfa", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userCfa", "password", { role: roles.cfa })

    const response = await httpClient.get("/api/authentified", { headers: bearerToken })
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie qu'on ne peut pas se connecter à une route d'admin en tant que cfa", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    const bearerToken = await createAndLogUser("userCfa", "password", { role: roles.cfa })

    const response = await httpClient.get("/api/admin", { headers: bearerToken })
    assert.notStrictEqual(response.status, 200)
  })
})
