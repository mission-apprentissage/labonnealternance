import assert from "assert"

import jwt, { JwtPayload } from "jsonwebtoken"
import { omit } from "lodash-es"
import { describe, expect, it } from "vitest"

import { createAndLogUser } from "@tests/utils/login.utils"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

import __filename from "../../../src/common/filename"
import { User } from "../../../src/common/model/index"
import { hash } from "../../../src/common/utils/sha512Utils"
import config from "../../../src/config"

describe("loginRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie qu'on peut se connecter", async () => {
    await createAndLogUser(httpClient, "user", "password")

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "user",
        password: "password",
      },
    })

    expect(response.statusCode).toBe(200)
    const decoded = jwt.verify(JSON.parse(response.body).token, config.auth.user.jwtSecret) as JwtPayload
    assert.ok(decoded.iat)
    assert.ok(decoded.exp)
    assert.deepStrictEqual(omit(decoded, ["iat", "exp"]), {
      sub: "user@mail.com",
      iss: config.appName,
      role: null,
    })
  })

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    await createAndLogUser(httpClient, "user", "password")

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "user",
        password: "INVALID",
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "INVALID",
        password: "INVALID",
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it("Vérifie que le mot de passe est rehashé si trop faible", async () => {
    await createAndLogUser(httpClient, "user", "password", { hash: hash("password", 1000) })

    let response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "user",
        password: "password",
      },
    })

    expect(response.statusCode).toBe(200)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found?.password.startsWith(`$6$rounds=${process.env.LBA_AUTH_PASSWORD_HASH_ROUNDS}`), true)

    response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "user",
        password: "password",
      },
    })
    expect(response.statusCode).toBe(200)
  })

  it("Vérifie que le mot de passe n'est pas rehashé si ok", async () => {
    await createAndLogUser(httpClient, "user", "password", { hash: hash("password", 1001) })
    const previous = await User.findOne({ username: "user" })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "user",
        password: "password",
      },
    })

    expect(response.statusCode).toBe(200)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(previous?.password, found?.password)
  })

  it("Vérifie que le mot de passe n'est pas rehashé si invalide", async () => {
    await createAndLogUser(httpClient, "user", "password", { hash: hash("password", 1001) })
    const previous = await User.findOne({ username: "user" })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/login",
      body: {
        username: "user",
        password: "invalid",
      },
    })

    expect(response.statusCode).toBe(401)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(previous?.password, found?.password)
  })
})
