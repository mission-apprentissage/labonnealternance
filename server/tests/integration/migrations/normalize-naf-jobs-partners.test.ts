import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260901163000-normalize-naf-jobs-partners"

/**
 * Ce test vit sous tests/ et non à côté de la migration : le runner liste tous les `.js` du
 * dossier migrations compilé, et `dist` contient les fichiers de test — un `*.test.ts` colocalisé
 * serait donc ramassé comme une migration.
 */
describe("migration normalize-naf-jobs-partners", () => {
  // useMongo() vide déjà toutes les collections en beforeEach
  useMongo()

  it("réécrit les NAF hétérogènes et laisse les autres intacts", async () => {
    await getDbCollection("jobs_partners").insertMany([
      generateJobsPartnersOfferPrivate({ partner_job_id: "a", workplace_naf_code: "4673A", workplace_naf_label: "Hôtels et hébergement similaire " }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "b", workplace_naf_code: "84.11Z", workplace_naf_label: "FABRICATION D'AUTRES PRODUITS LAITIERS" }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "c", workplace_naf_code: "62.02A", workplace_naf_label: "Conseil en systèmes et logiciels informatiques" }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "d", workplace_naf_code: null, workplace_naf_label: null }),
    ])

    await up()

    const byId = new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

    expect.soft(byId.get("a")?.workplace_naf_code).toBe("46.73A")
    expect.soft(byId.get("a")?.workplace_naf_label).toBe("Hôtels et hébergement similaire")
    expect.soft(byId.get("b")?.workplace_naf_code).toBe("84.11Z")
    expect.soft(byId.get("b")?.workplace_naf_label).toBe("Fabrication d'autres produits laitiers")
    // déjà canonique : ne doit pas bouger
    expect.soft(byId.get("c")?.workplace_naf_code).toBe("62.02A")
    expect.soft(byId.get("c")?.workplace_naf_label).toBe("Conseil en systèmes et logiciels informatiques")
    expect.soft(byId.get("d")?.workplace_naf_code).toBe(null)
    expect.soft(byId.get("d")?.workplace_naf_label).toBe(null)
  })

  it("ne touche pas updated_at, pour ne pas noyer le cron delta search_items", async () => {
    const updatedAt = new Date("2026-01-15T10:00:00.000Z")
    await getDbCollection("jobs_partners").insertOne(generateJobsPartnersOfferPrivate({ partner_job_id: "a", workplace_naf_code: "4673A", updated_at: updatedAt }))

    await up()

    const [job] = await getDbCollection("jobs_partners").find({}).toArray()
    expect.soft(job.workplace_naf_code).toBe("46.73A")
    expect.soft(job.updated_at).toEqual(updatedAt)
  })

  it("est idempotent", async () => {
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({ partner_job_id: "a", workplace_naf_code: "4673A", workplace_naf_label: "HÔTELS ET HÉBERGEMENT SIMILAIRE" })
    )

    await up()
    const afterFirst = await getDbCollection("jobs_partners").findOne({})
    await up()
    const afterSecond = await getDbCollection("jobs_partners").findOne({})

    expect(afterSecond).toEqual(afterFirst)
  })
})
