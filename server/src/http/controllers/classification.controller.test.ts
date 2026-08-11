import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import { updateClassificationAndSynchronise } from "./classification.controller"

const { addJobMock } = vi.hoisted(() => ({ addJobMock: vi.fn() }))
vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: addJobMock }
})

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

    // La régression corrigée : avec l'ancien nom de job kebab-case, aucun handler n'existait
    // ("Job not found", confirmé en prod via Sentry) et l'offre ne se republiait jamais. Le nom
    // correct est le nom JS exact de la fonction, enregistrée dans simple-job-definitions.ts.
    expect(addJobMock).toHaveBeenCalledTimes(1)
    expect(addJobMock).toHaveBeenCalledWith({ name: "processJobPartnersWithFilter", payload: { partner_job_id: { $in: [partner_job_id] } }, queued: true })
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

    expect(addJobMock).not.toHaveBeenCalled()
  })
})
