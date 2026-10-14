import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260928200000-backfill-missing-apply-url-jobs-partners"
import { updateUserWithAccountFields } from "@/services/user-recruteur.service"

// cf. backfill-offer-status-history-lba-5429.test.ts pour l'emplacement de ce test hors du dossier migrations
describe("migration backfill-missing-apply-url-jobs-partners", () => {
  useMongo()

  const withoutApplyUrl = (doc: IJobsPartnersOfferPrivate) => {
    const { apply_url: _, ...rest } = doc
    return rest as IJobsPartnersOfferPrivate
  }

  const insertLegacy = (docs: IJobsPartnersOfferPrivate[]) => getDbCollection("jobs_partners").insertMany(docs.map(withoutApplyUrl), { bypassDocumentValidation: true })

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  it("débloque la mise à jour du compte recruteur, qui propage ses coordonnées à ses offres", async () => {
    const user = generateUserWithAccountFixture({ email: "ancien@mail.fr" })
    await getDbCollection("userswithaccounts").insertOne(user)
    await insertLegacy([generateJobsPartnersOfferPrivate({ partner_job_id: "legacy", partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: user._id })])

    // Garde-fou anti-vacuité : sans ce refus, le test ne prouve rien.
    await expect(updateUserWithAccountFields(user._id, { phone: "0611111111" })).rejects.toMatchObject({ code: 121 })

    await up()
    await updateUserWithAccountFields(user._id, { email: "nouveau@mail.fr", phone: "0622222222" })

    const offer = (await readAll()).get("legacy")
    expect.soft(offer?.apply_url).toBeNull()
    expect.soft(offer?.apply_email).toBe("nouveau@mail.fr")
    expect.soft(offer?.apply_phone).toBe("0622222222")
  })

  it("ne touche pas aux offres qui ont déjà le champ, même à null", async () => {
    await getDbCollection("jobs_partners").insertMany([
      generateJobsPartnersOfferPrivate({ partner_job_id: "avec-url", partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, apply_url: "https://exemple.fr/postuler" }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "url-null", partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, apply_url: null }),
    ])
    const before = await readAll()

    await up()
    const after = await readAll()

    expect.soft(after.get("avec-url")).toEqual(before.get("avec-url"))
    expect.soft(after.get("url-null")).toEqual(before.get("url-null"))
  })

  it("complète aussi les offres d'autres partenaires et reste idempotente", async () => {
    await insertLegacy([
      generateJobsPartnersOfferPrivate({ partner_job_id: "lba", partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "hellowork", partner_label: JOBPARTNERS_LABEL.HELLOWORK }),
    ])

    await up()
    const afterFirst = await readAll()
    await up()
    const afterSecond = await readAll()

    for (const id of ["lba", "hellowork"]) {
      expect.soft(afterFirst.get(id)).toHaveProperty("apply_url", null)
      expect.soft(afterSecond.get(id)).toEqual(afterFirst.get(id))
    }
  })
})
