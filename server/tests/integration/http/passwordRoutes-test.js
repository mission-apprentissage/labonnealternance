import assert from "assert"
import { omit } from "lodash-es"
import jwt from "jsonwebtoken"
import config from "../../../src/config.js"
import httpTests from "../../utils/httpTests.js"
import { createPasswordToken } from "../../../src/common/utils/jwtUtils.js"
import { roles } from "../../../src/common/roles.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie qu'un utilisateur peut faire une demande de réinitialisation de mot de passe", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    await createAndLogUser("user", "password", { role: roles.administrator })

    const response = await httpClient.post("/api/password/forgotten-password", {
      username: "user",
    })

    assert.strictEqual(response.status, 200)
    assert.ok(response.data.url)
  })

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur inconnu", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    await createAndLogUser("admin", "password", { role: roles.administrator })

    const response = await httpClient.post("/api/password/forgotten-password", {
      username: "inconnu",
    })

    assert.strictEqual(response.status, 400)
  })

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur invalide", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    await createAndLogUser("user123", "password")

    const response = await httpClient.post("/api/password/forgotten-password", {
      type: "cfa",
      username: "user123456",
    })

    assert.strictEqual(response.status, 400)
  })

  it("Vérifie qu'un utilisateur peut changer son mot de passe", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    await createAndLogUser("admin", "password", { role: roles.administrator })

    const response = await httpClient.post("/api/password/reset-password", {
      passwordToken: createPasswordToken("admin"),
      newPassword: "Password!123456",
    })

    assert.strictEqual(response.status, 200)
    const decoded = jwt.verify(response.data.token, config.auth.user.jwtSecret)
    assert.ok(decoded.iat)
    assert.ok(decoded.exp)
    assert.deepStrictEqual(omit(decoded, ["iat", "exp"]), {
      sub: "admin",
      iss: config.appName,
      role: roles.administrator,
    })
  })

  it("Vérifie qu'on doit spécifier un mot de passe valide", async () => {
    const { httpClient, createAndLogUser } = await startServer()
    await createAndLogUser("admin", "password", { role: roles.administrator })

    const response = await httpClient.post("/api/password/reset-password", {
      passwordToken: createPasswordToken("admin"),
      newPassword: "invalid",
    })

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(response.data, {
      statusCode: 400,
      error: "Bad Request",
      message: "Erreur de validation",
      details: [
        {
          message: '"newPassword" with value "invalid" fails to match the required pattern: /^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$/',
          path: ["newPassword"],
          type: "string.pattern.base",
          context: { regex: {}, value: "invalid", label: "newPassword", key: "newPassword" },
        },
      ],
    })
  })
})
