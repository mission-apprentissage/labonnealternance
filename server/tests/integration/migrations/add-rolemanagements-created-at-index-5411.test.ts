import { useMongo } from "@tests/utils/mongo.test.utils"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261012120000-add-rolemanagements-created-at-index"

// Sous tests/ et non à côté de la migration, cf. normalize-naf-jobs-partners.test.ts.
describe("migration add-rolemanagements-created-at-index", () => {
  useMongo()

  const indexNames = async () => (await getDbCollection("rolemanagements").indexes()).map((index) => index.name)

  it("crée l'index { authorized_type, createdAt } lu par l'alerte sur le taux d'auto-validation", async () => {
    await getDbCollection("rolemanagements").dropIndex("authorized_type_1_createdAt_1")
    expect(await indexNames()).not.toContain("authorized_type_1_createdAt_1")

    await up()

    expect(await indexNames()).toContain("authorized_type_1_createdAt_1")
  }, 60_000)
})
