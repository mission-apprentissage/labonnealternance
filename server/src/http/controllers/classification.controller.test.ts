import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import { updateClassificationAndSynchronise } from "./classification.controller"

const { processJobPartnersWithFilterMock } = vi.hoisted(() => ({ processJobPartnersWithFilterMock: vi.fn() }))
vi.mock("@/jobs/offre-partenaire/process-job-partners-for-api", () => ({
  processJobPartnersWithFilter: processJobPartnersWithFilterMock,
}))

const partner_label = "un partenaire"
const partner_job_id = "job-1"

describe("updateClassificationAndSynchronise", () => {
  useMongo()

  beforeEach(async () => {
    vi.clearAllMocks()
    await getDbCollection("cache_classification").deleteMany({})
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("réexécute réellement le pipeline (et non un job-queue mal nommé) quand la correction humaine contredit le modèle", async () => {
    await getDbCollection("cache_classification").insertOne({
      _id: new ObjectId(),
      partner_label,
      partner_job_id,
      classification: "unpublish",
      scores: { publish: 0.2, unpublish: 0.8 },
      model: "model",
      human_verification: null,
      created_at: new Date(),
    })
    await givenSomeComputedJobPartners([
      {
        partner_label,
        partner_job_id,
        business_error: JOB_PARTNER_BUSINESS_ERROR.CFA,
        jobs_in_success: [COMPUTED_ERROR_SOURCE.CLASSIFICATION],
      },
    ])

    await updateClassificationAndSynchronise({ classification: "publish", partner_job_ids: [partner_job_id] })

    const cached = await getDbCollection("cache_classification").findOne({ partner_job_id })
    expect(cached?.human_verification).toBe("publish")

    const computed = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id })
    expect(computed?.business_error).toBeNull()
    expect(computed?.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)

    // La régression corrigée : sans cet appel direct, l'offre ne repassait jamais par
    // validateComputedJobPartners/importFromComputedToJobsPartners et ne se republiait jamais.
    expect(processJobPartnersWithFilterMock).toHaveBeenCalledTimes(1)
    expect(processJobPartnersWithFilterMock).toHaveBeenCalledWith({ partner_job_id: { $in: [partner_job_id] } })
  })

  it("ne relance pas le pipeline quand la correction humaine confirme le modèle", async () => {
    await getDbCollection("cache_classification").insertOne({
      _id: new ObjectId(),
      partner_label,
      partner_job_id,
      classification: "publish",
      scores: { publish: 0.9, unpublish: 0.1 },
      model: "model",
      human_verification: null,
      created_at: new Date(),
    })
    await givenSomeComputedJobPartners([{ partner_label, partner_job_id, business_error: null }])

    await updateClassificationAndSynchronise({ classification: "publish", partner_job_ids: [partner_job_id] })

    expect(processJobPartnersWithFilterMock).not.toHaveBeenCalled()
  })
})
