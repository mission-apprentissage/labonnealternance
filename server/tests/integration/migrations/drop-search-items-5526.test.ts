import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { describe, expect, it } from "vitest"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260923090000-drop-search-items-5526"

// Sous tests/ et non à côté de la migration, cf. normalize-naf-jobs-partners.test.ts.
describe("migration drop-search-items-5526", () => {
  useMongo()

  const exists = async (name: string) => (await getDatabase().listCollections({ name }).toArray()).length > 0

  it("supprime search_items et le reliquat search_items_keywords, sans toucher aux corpus par mode", async () => {
    const offre = generateSearchItemFixture()
    await getDatabase().collection("search_items").insertOne(offre)
    await getDatabase().collection("search_items_keywords").insertOne({ source_hash: "hash-1" })
    await getDbCollection("search_jobs").insertOne(offre)

    await up()

    expect(await exists("search_items")).toBe(false)
    expect(await exists("search_items_keywords")).toBe(false)
    expect(await getDbCollection("search_jobs").countDocuments({ _id: offre._id })).toBe(1)
  })

  it("passe sur une base fraîche où les collections n'existent pas", async () => {
    await expect(up()).resolves.toBeUndefined()
  })
})
