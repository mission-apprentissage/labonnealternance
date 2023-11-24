import assert from "assert"

import { EApplicantRole } from "shared/constants/rdva"
import { describe, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"

import { User } from "../../../src/common/model/index"
import { authenticate, changePassword, createUser } from "../../../src/services/user.service"

describe("users", () => {
  useMongo()

  it("Permet de créer un utilisateur", async () => {
    const created = await createUser("user", "password", {})
    assert.strictEqual(created.username, "user")
    assert.strictEqual(created.password.startsWith(`$6$rounds=${process.env.LBA_AUTH_PASSWORD_HASH_ROUNDS}`), true)

    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found?.username, "user")
    assert.strictEqual(found?.password.startsWith(`$6$rounds=${process.env.LBA_AUTH_PASSWORD_HASH_ROUNDS}`), true)
  })

  it("Permet de créer un utilisateur avec le role d'administrateur", async () => {
    const user = await createUser("userAdmin", "password", { role: EApplicantRole.ADMINISTRATOR })
    const found = await User.findOne({ username: "userAdmin" })

    assert.strictEqual(user.role, EApplicantRole.ADMINISTRATOR)
    assert.strictEqual(found?.role, EApplicantRole.ADMINISTRATOR)
  })

  it("Permet de créer un utilisateur avec le role de candidat", async () => {
    const user = await createUser("userCandidat", "password", { role: EApplicantRole.CANDIDAT })
    const found = await User.findOne({ username: "userCandidat" })

    assert.strictEqual(user.role, EApplicantRole.CANDIDAT)
    assert.strictEqual(found?.role, EApplicantRole.CANDIDAT)
  })

  it("Permet de créer un utilisateur avec le role de cfa", async () => {
    const user = await createUser("userCfa", "password", { role: EApplicantRole.CFA })
    const found = await User.findOne({ username: "userCfa" })

    assert.strictEqual(user.role, EApplicantRole.CFA)
    assert.strictEqual(found?.role, EApplicantRole.CFA)
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
