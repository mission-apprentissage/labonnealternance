import assert from "assert"

import jwt, { JwtPayload } from "jsonwebtoken"
import { omit } from "lodash-es"
import { describe, expect, it } from "vitest"

import { createAndLogUser } from "@tests/utils/login.utils"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

import { createPasswordToken } from "../../../src/common/utils/jwtUtils"
import config from "../../../src/config"
import { ROLES } from "../../../src/services/constant.service"

describe("passwordRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie qu'un utilisateur peut faire une demande de réinitialisation de mot de passe", async () => {
    await createAndLogUser(httpClient, "user", "password", { role: ROLES.administrator })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/password/forgotten-password",
      body: {
        username: "user",
      },
    })

    expect(response.statusCode).toBe(200)
    assert.ok(JSON.parse(response.body).url)
  })

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur inconnu", async () => {
    await createAndLogUser(httpClient, "admin", "password", { role: ROLES.administrator })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/password/forgotten-password",
      body: {
        username: "inconnu",
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur invalide", async () => {
    await createAndLogUser(httpClient, "user123", "password")

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/password/forgotten-password",
      body: {
        type: "cfa",
        username: "user123456",
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it("Vérifie qu'un utilisateur peut changer son mot de passe", async () => {
    await createAndLogUser(httpClient, "admin", "password", { role: ROLES.administrator })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/password/reset-password",
      body: {
        passwordToken: createPasswordToken("admin"),
        newPassword: "Password!123456",
      },
    })

    expect(response.statusCode).toBe(200)
    const decoded = jwt.verify(JSON.parse(response.body).token, config.auth.user.jwtSecret) as JwtPayload
    assert.ok(decoded.iat)
    assert.ok(decoded.exp)
    assert.deepStrictEqual(omit(decoded, ["iat", "exp"]), {
      sub: "admin@mail.com",
      iss: config.appName,
      role: ROLES.administrator,
    })
  })

  it("Vérifie qu'on doit spécifier un mot de passe valide", async () => {
    await createAndLogUser(httpClient, "admin", "password", { role: ROLES.administrator })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/password/reset-password",
      body: {
        passwordToken: createPasswordToken("admin"),
        newPassword: "invalid",
      },
    })

    expect(response.statusCode).toBe(400)
    assert.deepStrictEqual(response.body, {
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
