import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOBS_PARTNERS_OFFER_ORIGIN } from "shared/models/jobs-partners-computed.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261006120000-normalize-lba-offer-origin-5645"

// Test hors du dossier migrations : cf. normalize-naf-jobs-partners.test.ts
describe("migration normalize-lba-offer-origin-5645", () => {
  useMongo()

  const lbaOffer = (partner_job_id: string, offer_origin: string | null) =>
    generateJobsPartnersOfferPrivate({ partner_job_id, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_origin })

  it("ramène les origines désignant le site à la valeur de l'enum, quelle que soit la casse", async () => {
    await getDbCollection("jobs_partners").insertMany([
      lbaOffer("labonnealternance", "labonnealternance"),
      lbaOffer("Labonnealternance", "Labonnealternance"),
      lbaOffer("LABONNEALTERNANCE", "LABONNEALTERNANCE"),
      lbaOffer("lba", "lba"),
      lbaOffer("LBA", "LBA"),
      lbaOffer("Lba-espaces", " Lba "),
      lbaOffer("vide", ""),
    ])

    await up()

    const offers = await getDbCollection("jobs_partners").find({}).toArray()
    expect.soft(offers).toHaveLength(7)
    for (const offer of offers) {
      expect.soft(offer.offer_origin, offer.partner_job_id).toBe(JOBS_PARTNERS_OFFER_ORIGIN.LBA)
    }
  })

  it("conserve les origines partenaires, les valeurs nulles et les offres des autres partenaires", async () => {
    await getDbCollection("jobs_partners").insertMany([
      lbaOffer("partenaire", "1jeune1solution"),
      lbaOffer("enum", JOBS_PARTNERS_OFFER_ORIGIN.LBA),
      lbaOffer("contient-lba", "lba-campagne"),
      lbaOffer("null", null),
      generateJobsPartnersOfferPrivate({ partner_job_id: "flux", partner_label: JOBPARTNERS_LABEL.HELLOWORK, offer_origin: "lba" }),
    ])

    await up()

    const byId = new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j.offer_origin]))
    expect.soft(byId.get("partenaire")).toBe("1jeune1solution")
    expect.soft(byId.get("enum")).toBe(JOBS_PARTNERS_OFFER_ORIGIN.LBA)
    expect.soft(byId.get("contient-lba")).toBe("lba-campagne")
    expect.soft(byId.get("null")).toBe(null)
    expect.soft(byId.get("flux")).toBe("lba")
  })
})
