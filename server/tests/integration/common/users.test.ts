import assert from "assert"

import { EApplicantRole } from "shared/constants/rdva"
import { describe, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"

import { User } from "../../../src/common/model/index"
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
    const user = await createUser({ role: EApplicantRole.ADMINISTRATOR, ...userTest })
    const found = await User.findOne({ firstname: "firstname", role: EApplicantRole.ADMINISTRATOR })

    assert.strictEqual(user.role, EApplicantRole.ADMINISTRATOR)
    assert.strictEqual(found?.role, EApplicantRole.ADMINISTRATOR)
  })

  it("Permet de créer un utilisateur avec le role de candidat", async () => {
    const user = await createUser({ role: EApplicantRole.CANDIDAT, ...userTest })
    const found = await User.findOne({ firstname: "firstname", role: EApplicantRole.CANDIDAT })

    assert.strictEqual(user.role, EApplicantRole.CANDIDAT)
    assert.strictEqual(found?.role, EApplicantRole.CANDIDAT)
  })

  it("Permet de créer un utilisateur avec le role de cfa", async () => {
    const user = await createUser({ role: EApplicantRole.CFA, ...userTest })
    const found = await User.findOne({ firstname: "firstname", role: EApplicantRole.CFA })

    assert.strictEqual(user.role, EApplicantRole.CFA)
    assert.strictEqual(found?.role, EApplicantRole.CFA)
  })
})
