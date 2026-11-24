import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261124120000-cancel-api-jobs-partners-without-apply-method-5872"

// cf. backfill-offer-status-history-lba-5429.test.ts pour l'emplacement de ce test hors du dossier migrations
describe("migration cancel-api-jobs-partners-without-apply-method-5872", () => {
  useMongo()

  const GRANTED_BY = "20261124120000-cancel-api-jobs-partners-without-apply-method-5872"
  const API_PARTNER = "partenaire-api"
  const NO_APPLY = { apply_url: null, apply_email: null, apply_phone: null }

  const insert = (docs: IJobsPartnersOfferPrivate[]) => getDbCollection("jobs_partners").insertMany(docs, { bypassDocumentValidation: true })
  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  it.each([
    ["null", NO_APPLY],
    ["vides", { apply_url: "", apply_email: "", apply_phone: "" }],
    ["faits de blancs", { apply_url: " ", apply_email: "\t", apply_phone: " \n " }],
  ])("annule une offre API active aux trois apply_* %s, avec une seule trace", async (_, apply) => {
    await insert([generateJobsPartnersOfferPrivate({ partner_job_id: "sans", partner_label: API_PARTNER, ...apply })])

    await up()
    await up()

    const offer = (await readAll()).get("sans")
    expect.soft(offer?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect
      .soft(offer?.offer_status_history.filter((entry) => entry.granted_by === GRANTED_BY))
      .toEqual([{ date: expect.any(Date), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "NO_APPLY_METHOD", granted_by: GRANTED_BY }])
  })

  it("ne touche ni aux offres candidatables, ni aux offres déjà closes, ni aux offres de flux ou LBA", async () => {
    await insert([
      generateJobsPartnersOfferPrivate({ partner_job_id: "telephone", partner_label: API_PARTNER, ...NO_APPLY, apply_phone: "0102030405" }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "annulee", partner_label: API_PARTNER, ...NO_APPLY, offer_status: JOB_STATUS_ENGLISH.ANNULEE }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "flux", partner_label: JOBPARTNERS_LABEL.HELLOWORK, ...NO_APPLY }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "lba", partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, ...NO_APPLY }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "recruteur-lba", partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, ...NO_APPLY }),
    ])
    const before = await readAll()

    await up()

    expect.soft(await readAll()).toEqual(before)
  })
})
