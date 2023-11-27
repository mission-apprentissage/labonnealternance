import assert from "assert"

import { describe, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"

import { User } from "../../../src/common/model/index"
import { ROLES } from "../../../src/services/constant.service"
import { createUser } from "../../../src/services/user.service"

describe("users", () => {
  useMongo()

  it("Permet de créer un utilisateur", async () => {
    const created = await createUser("user", {})
    assert.strictEqual(created.username, "user")

    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found?.username, "user")
  })

  it("Permet de créer un utilisateur avec le role d'administrateur", async () => {
    const user = await createUser("userAdmin", { role: ROLES.administrator })
    const found = await User.findOne({ username: "userAdmin" })

    assert.strictEqual(user.role, ROLES.administrator)
    assert.strictEqual(found?.role, ROLES.administrator)
  })

  it("Permet de créer un utilisateur avec le role de candidat", async () => {
    const user = await createUser("userCandidat", { role: ROLES.candidat })
    const found = await User.findOne({ username: "userCandidat" })

    assert.strictEqual(user.role, ROLES.candidat)
    assert.strictEqual(found?.role, ROLES.candidat)
  })

  it("Permet de créer un utilisateur avec le role de cfa", async () => {
    const user = await createUser("userCfa", { role: ROLES.cfa })
    const found = await User.findOne({ username: "userCfa" })

    assert.strictEqual(user.role, ROLES.cfa)
    assert.strictEqual(found?.role, ROLES.cfa)
  })
})
