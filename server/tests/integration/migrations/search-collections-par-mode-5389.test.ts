import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { describe, expect, it } from "vitest"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260922180000-search-collections-par-mode-5389"

// Sous tests/ et non à côté de la migration, cf. normalize-naf-jobs-partners.test.ts.
describe("migration search-collections-par-mode-5389", () => {
  useMongo()

  const legacyKeywordsEntry = (source_hash: string) => ({
    _id: new ObjectId(),
    source_hash,
    keywords: ["vente"],
    model: "mistral-small-latest",
    origin: "batch",
    created_at: new Date(),
    last_used_at: new Date(),
  })

  it("copie search_items dans la collection de chaque mode, keywords compris", async () => {
    const offre = generateSearchItemFixture({ type: "offre", is_formation_included: false, keywords: ["vente"] })
    const couplee = generateSearchItemFixture({ type: "offre", is_formation_included: true })
    // is_formation_included null sur une offre : near-miss du `$ne: true`, elle reste en emplois.
    const offreSansFlag = generateSearchItemFixture({ type: "offre", is_formation_included: null })
    const formation = generateSearchItemFixture({ type: "formation", sub_type: "formation", is_formation_included: null })
    // Collection hors modèles depuis sa suppression, cf. la migration.
    await getDatabase().collection("search_items").insertMany([offre, couplee, offreSansFlag, formation])

    await up()

    const idsOf = async (name: "search_jobs" | "search_jobs_with_training" | "search_trainings") =>
      (await getDbCollection(name).find({}).toArray()).map((doc) => doc._id.toString()).sort()
    expect(await idsOf("search_jobs")).toEqual([offre._id.toString(), offreSansFlag._id.toString()].sort())
    expect(await idsOf("search_jobs_with_training")).toEqual([couplee._id.toString()])
    expect(await idsOf("search_trainings")).toEqual([formation._id.toString()])
    expect((await getDbCollection("search_jobs").findOne({ _id: offre._id }))?.keywords).toEqual(["vente"])
  })

  it("renomme le cache legacy quand search_jobs_keywords est vide", async () => {
    await getDatabase().collection("search_items_keywords").insertOne(legacyKeywordsEntry("hash-1"))

    await up()

    expect(await getDbCollection("search_jobs_keywords").countDocuments({ source_hash: "hash-1" })).toBe(1)
    expect(await getDatabase().listCollections({ name: "search_items_keywords" }).toArray()).toHaveLength(0)
  })

  it("fusionne le cache legacy sans écraser une entrée déjà présente dans search_jobs_keywords", async () => {
    await getDatabase()
      .collection("search_items_keywords")
      .insertMany([legacyKeywordsEntry("hash-1"), legacyKeywordsEntry("hash-2")])
    await getDbCollection("search_jobs_keywords").insertOne({ ...legacyKeywordsEntry("hash-1"), keywords: ["récent"], origin: "immediate" })

    await up()

    expect((await getDbCollection("search_jobs_keywords").findOne({ source_hash: "hash-1" }))?.keywords).toEqual(["récent"])
    expect(await getDbCollection("search_jobs_keywords").countDocuments({ source_hash: "hash-2" })).toBe(1)
    expect(await getDatabase().listCollections({ name: "search_items_keywords" }).toArray()).toHaveLength(0)
  })

  it("repasse les batchs Mistral suivis au kind search_jobs_keywords", async () => {
    await getDatabase().collection("mistral_batch_jobs").insertOne(
      {
        _id: new ObjectId(),
        job_id: "job-1",
        kind: "search_items_keywords",
        status: "submitted",
        request_count: 1,
        applied_count: null,
        error: null,
        submitted_at: new Date(),
        checked_at: null,
        applied_at: null,
      },
      { bypassDocumentValidation: true }
    )

    await up()

    expect(await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-1" })).toMatchObject({ kind: "search_jobs_keywords" })
  })
})
