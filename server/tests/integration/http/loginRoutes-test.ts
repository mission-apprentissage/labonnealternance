import assert from "assert"
import jwt from "jsonwebtoken"
import { omit } from "lodash-es"
import config from "../../../src/config.js"
import httpTests from "../../utils/httpTests.js"
import { User } from "../../../src/common/model/index.js"
import { hash } from "../../../src/common/utils/sha512Utils.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie qu'on peut se connecter", async () => {
    const { httpClient, components } = await startServer()
    await components.users.createUser("user", "password")

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    })

    assert.strictEqual(response.status, 200)
    const decoded = jwt.verify(response.data.token, config.auth.user.jwtSecret)
    assert.ok(decoded.iat)
    assert.ok(decoded.exp)
    assert.deepStrictEqual(omit(decoded, ["iat", "exp"]), {
      sub: "user",
      iss: config.appName,
      role: null,
    })
  })

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    const { httpClient, components } = await startServer()
    await components.users.createUser("user", "password")

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "INVALID",
    })

    assert.strictEqual(response.status, 401)
  })

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.post("/api/login", {
      username: "INVALID",
      password: "INVALID",
    })

    assert.strictEqual(response.status, 401)
  })

  it("Vérifie que le mot de passe est rehashé si trop faible", async () => {
    const { httpClient, components } = await startServer()
    await components.users.createUser("user", "password", { hash: hash("password", 1000) })

    let response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    })

    assert.strictEqual(response.status, 200)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found.password.startsWith("$6$rounds=1001"), true)

    response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    })
    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que le mot de passe n'est pas rehashé si ok", async () => {
    const { httpClient, components } = await startServer()
    await components.users.createUser("user", "password", { hash: hash("password", 1001) })
    const previous = await User.findOne({ username: "user" })

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    })

    assert.strictEqual(response.status, 200)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(previous.password, found.password)
  })

  it("Vérifie que le mot de passe n'est pas rehashé si invalide", async () => {
    const { httpClient, components } = await startServer()
    await components.users.createUser("user", "password", { hash: hash("password", 1001) })
    const previous = await User.findOne({ username: "user" })

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "invalid",
    })

    assert.strictEqual(response.status, 401)
    const found = await User.findOne({ username: "user" })
    assert.strictEqual(previous.password, found.password)
  })
})
