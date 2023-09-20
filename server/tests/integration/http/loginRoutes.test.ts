import assert from "assert"

import jwt from "jsonwebtoken"
import { omit } from "lodash-es"
import { describe, it } from "vitest"

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

    const response = await httpClient().post("/api/login").send({
      username: "user",
      password: "password",
    })

    assert.strictEqual(response.status, 200)
    const decoded = jwt.verify(response.body.token, config.auth.user.jwtSecret)
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

    const response = await httpClient().post("/api/login").send({
      username: "user",
      password: "INVALID",
    })

    assert.strictEqual(response.status, 401)
  })

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const response = await httpClient().post("/api/login").send({
      username: "INVALID",
      password: "INVALID",
    })

    assert.strictEqual(response.status, 401)
  })

  it("Vérifie que le mot de passe est rehashé si trop faible", async () => {
    await createAndLogUser(httpClient, "user", "password", { hash: hash("password", 1000) })

    let response = await httpClient().post("/api/login").send({
      username: "user",
      password: "password",
    })

    assert.strictEqual(response.status, 200)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found?.password.startsWith("$6$rounds=1001"), true)

    response = await httpClient().post("/api/login").send({
      username: "user",
      password: "password",
    })
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que le mot de passe n'est pas rehashé si ok", async () => {
    await createAndLogUser(httpClient, "user", "password", { hash: hash("password", 1001) })
    const previous = await User.findOne({ username: "user" })

    const response = await httpClient().post("/api/login").send({
      username: "user",
      password: "password",
    })

    assert.strictEqual(response.status, 200)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(previous?.password, found?.password)
  })

  it("Vérifie que le mot de passe n'est pas rehashé si invalide", async () => {
    await createAndLogUser(httpClient, "user", "password", { hash: hash("password", 1001) })
    const previous = await User.findOne({ username: "user" })

    const response = await httpClient().post("/api/login").send({
      username: "user",
      password: "invalid",
    })

    assert.strictEqual(response.status, 401)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(previous?.password, found?.password)
  })
})
