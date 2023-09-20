import assert from "assert"

import { User } from "../../../src/common/model/index"
import { ROLES } from "../../../src/services/constant.service"
import { authenticate, changePassword, createUser } from "../../../src/services/user.service"
import { describe, expect, it } from "vitest"
import { useMongo } from "@tests/utils/mongo.utils"

describe("users", () => {
  useMongo()

  it("Permet de créer un utilisateur", async () => {
    const created = await createUser("user", "password", {})
    assert.strictEqual(created.username, "user")
    assert.strictEqual(created.password.startsWith("$6$rounds=1001"), true)

    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found?.username, "user")
    assert.strictEqual(found?.password.startsWith("$6$rounds=1001"), true)
  })

  it("Permet de créer un utilisateur avec le role d'administrateur", async () => {
    const user = await createUser("userAdmin", "password", { role: ROLES.administrator })
    const found = await User.findOne({ username: "userAdmin" })

    assert.strictEqual(user.role, ROLES.administrator)
    assert.strictEqual(found?.role, ROLES.administrator)
  })

  it("Permet de créer un utilisateur avec le role de candidat", async () => {
    const user = await createUser("userCandidat", "password", { role: ROLES.candidat })
    const found = await User.findOne({ username: "userCandidat" })

    assert.strictEqual(user.role, ROLES.candidat)
    assert.strictEqual(found?.role, ROLES.candidat)
  })

  it("Permet de créer un utilisateur avec le role de cfa", async () => {
    const user = await createUser("userCfa", "password", { role: ROLES.cfa })
    const found = await User.findOne({ username: "userCfa" })

    assert.strictEqual(user.role, ROLES.cfa)
    assert.strictEqual(found?.role, ROLES.cfa)
  })

  it("Vérifie que le mot de passe est valide", async () => {
    await createUser("user", "password", {})
    const user = await authenticate("user", "password")

    assert.strictEqual(user?.username, "user")
  })

  it("Vérifie que le mot de passe est invalide", async () => {
    await createUser("user", "password", {})
    const user = await authenticate("user", "INVALID")

    assert.strictEqual(user, null)
  })

  it("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    await createUser("user", "password", {})
    await changePassword("user", "newPassword")
    const user = await authenticate("user", "newPassword")

    assert.strictEqual(user?.username, "user")
  })
})
