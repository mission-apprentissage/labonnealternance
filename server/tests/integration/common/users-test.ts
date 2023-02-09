import assert from "assert"
import integrationTests from "../../utils/integrationTests.js"
import users from "../../../src/common/components/users.js"
import { User } from "../../../src/common/model/index.js"
import { roles } from "../../../src/common/roles.js"
import __filename from "../../../src/common/filename.js"

integrationTests(__filename(import.meta.url), () => {
  it("Permet de créer un utilisateur", async () => {
    const { createUser } = await users()

    const created = await createUser("user", "password")
    assert.strictEqual(created.username, "user")
    assert.strictEqual(created.password.startsWith("$6$rounds=1001"), true)

    const found = await User.findOne({ username: "user" })
    assert.strictEqual(found.username, "user")
    assert.strictEqual(found.password.startsWith("$6$rounds=1001"), true)
  })

  it("Permet de créer un utilisateur avec le role d'administrateur", async () => {
    const { createUser } = await users()

    const user = await createUser("userAdmin", "password", { role: roles.administrator })
    const found = await User.findOne({ username: "userAdmin" })

    assert.strictEqual(user.role, roles.administrator)
    assert.strictEqual(found.role, roles.administrator)
  })

  it("Permet de créer un utilisateur avec le role de candidat", async () => {
    const { createUser } = await users()

    const user = await createUser("userCandidat", "password", { role: roles.candidat })
    const found = await User.findOne({ username: "userCandidat" })

    assert.strictEqual(user.role, roles.candidat)
    assert.strictEqual(found.role, roles.candidat)
  })

  it("Permet de créer un utilisateur avec le role de cfa", async () => {
    const { createUser } = await users()

    const user = await createUser("userCfa", "password", { role: roles.cfa })
    const found = await User.findOne({ username: "userCfa" })

    assert.strictEqual(user.role, roles.cfa)
    assert.strictEqual(found.role, roles.cfa)
  })

  it("Permet de supprimer un utilisateur", async () => {
    const { createUser, removeUser } = await users()

    await createUser("userToDelete", "password", { role: roles.administrator })
    await removeUser("userToDelete")

    const found = await User.findOne({ username: "userToDelete" })
    assert.strictEqual(found, null)
  })

  it("Vérifie que le mot de passe est valide", async () => {
    const { createUser, authenticate } = await users()

    await createUser("user", "password")
    const user = await authenticate("user", "password")

    assert.strictEqual(user.username, "user")
  })

  it("Vérifie que le mot de passe est invalide", async () => {
    const { createUser, authenticate } = await users()

    await createUser("user", "password")
    const user = await authenticate("user", "INVALID")

    assert.strictEqual(user, null)
  })

  it("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    const { createUser, authenticate, changePassword } = await users()

    await createUser("user", "password")
    await changePassword("user", "newPassword")
    const user = await authenticate("user", "newPassword")

    assert.strictEqual(user.username, "user")
  })
})
