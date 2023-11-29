import assert from "assert"

import { describe, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"

import { User } from "../../../src/common/model/index"
import { ROLES } from "../../../src/services/constant.service"
import { createUser } from "../../../src/services/user.service"

const userTest = { lastname: "lastname", firstname: "firstname" }

describe("users", () => {
  useMongo()

  it("Permet de créer un utilisateur", async () => {
    const created = await createUser(userTest)
    assert.strictEqual(created.firstname, "firstname")

    const found = await User.findOne({ firstname: "firstname" })
    assert.strictEqual(found?.firstname, "firstname")
  })

  it("Permet de créer un utilisateur avec le role d'administrateur", async () => {
    const user = await createUser({ role: ROLES.administrator, ...userTest })
    const found = await User.findOne({ firstname: "firstname", role: ROLES.administrator })

    assert.strictEqual(user.role, ROLES.administrator)
    assert.strictEqual(found?.role, ROLES.administrator)
  })

  it("Permet de créer un utilisateur avec le role de candidat", async () => {
    const user = await createUser({ role: ROLES.candidat, ...userTest })
    const found = await User.findOne({ firstname: "firstname", role: ROLES.candidat })

    assert.strictEqual(user.role, ROLES.candidat)
    assert.strictEqual(found?.role, ROLES.candidat)
  })

  it("Permet de créer un utilisateur avec le role de cfa", async () => {
    const user = await createUser({ role: ROLES.cfa, ...userTest })
    const found = await User.findOne({ firstname: "firstname", role: ROLES.cfa })

    assert.strictEqual(user.role, ROLES.cfa)
    assert.strictEqual(found?.role, ROLES.cfa)
  })
})
