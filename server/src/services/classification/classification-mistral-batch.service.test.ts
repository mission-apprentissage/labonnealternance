import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { downloadMistralBatchOutput, getMistralBatchJob, submitMistralBatch } from "@/services/mistralai/mistralai.service"

import { applyPendingClassificationBatches, submitClassificationBatch } from "./classification-mistral-batch.service"

const { addJobMock } = vi.hoisted(() => ({ addJobMock: vi.fn() }))
vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: addJobMock }
})

vi.mock("@/services/mistralai/mistralai.service", () => ({
  submitMistralBatch: vi.fn(),
  getMistralBatchJob: vi.fn(),
  downloadMistralBatchOutput: vi.fn(),
}))

vi.mock("@/common/utils/slack-utils", () => ({
  notifyToSlack: vi.fn(),
}))

describe("classification-mistral-batch.service", () => {
  useMongo()

  beforeEach(async () => {
    vi.clearAllMocks()
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("cache_classification").deleteMany({})
    await getDbCollection("mistral_batch_jobs").deleteMany({})
  })

  describe("submitClassificationBatch", () => {
    it("soumet les documents matchant le filtre et enregistre le suivi", async () => {
      const [job] = await givenSomeComputedJobPartners([{ offer_title: "Vendeur", workplace_name: "CFA Test" }])
      vi.mocked(submitMistralBatch).mockResolvedValue("mistral-job-1")

      const jobId = await submitClassificationBatch({ _id: job._id })

      expect(jobId).toBe("mistral-job-1")
      const requests = vi.mocked(submitMistralBatch).mock.calls[0][0].requests
      expect(requests).toHaveLength(1)
      expect(requests[0].customId).toBe(job._id.toString())
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "mistral-job-1" })
      expect(tracked).toMatchObject({ kind: "jobs_partners_classification", status: "submitted", request_count: 1 })
    })

    it("ne soumet rien si le filtre ne matche aucun document", async () => {
      const jobId = await submitClassificationBatch({ _id: new ObjectId() })

      expect(jobId).toBeNull()
      expect(submitMistralBatch).not.toHaveBeenCalled()
    })
  })

  describe("applyPendingClassificationBatches", () => {
    const trackedJob = (jobId: string) => ({
      _id: new ObjectId(),
      job_id: jobId,
      kind: "jobs_partners_classification" as const,
      status: "submitted" as const,
      request_count: 1,
      applied_count: null,
      error: null,
      submitted_at: new Date(),
      checked_at: null,
      applied_at: null,
    })

    it("job terminé : cache et computed_jobs_partners mis à jour, pipeline re-déclenché, statut applied", async () => {
      const [job] = await givenSomeComputedJobPartners([
        {
          offer_title: "Vendeur",
          workplace_name: "CFA Test",
          business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING,
          jobs_in_success: [COMPUTED_ERROR_SOURCE.CLASSIFICATION],
        },
      ])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ok"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "SUCCESS", outputFile: "file-1" } as never)
      vi.mocked(downloadMistralBatchOutput).mockResolvedValue(new Map([[job._id.toString(), '{"label":"unpublish","scores":{"publish":0.1,"unpublish":0.9}}']]))

      const counters = await applyPendingClassificationBatches()

      expect(counters.applied).toBe(1)
      const cached = await getDbCollection("cache_classification").findOne({ partner_job_id: job.partner_job_id, partner_label: job.partner_label })
      expect(cached).toMatchObject({ classification: "unpublish", model: "mistral:mistral-small-latest" })
      const updated = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(updated?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CFA)
      expect(updated?.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
      expect(addJobMock).toHaveBeenCalledWith({ name: "processJobPartnersWithFilter", payload: { _id: { $in: [job._id] } } })
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-ok" })
      expect(tracked).toMatchObject({ status: "applied", applied_count: 1 })
    })

    it("job en échec terminal : statut failed + alerte Slack, le document reste bloqué (repris par le filet de sécurité)", async () => {
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() }])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ko"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "FAILED", outputFile: null } as never)

      const counters = await applyPendingClassificationBatches()

      expect(counters.failed).toBe(1)
      expect(notifyToSlack).toHaveBeenCalledOnce()
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-ko" })
      expect(tracked).toMatchObject({ status: "failed", error: "FAILED" })
      const stillPending = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(stillPending?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
    })

    it("filet de sécurité : débloque une offre pendante depuis plus de 6h, même sans job suivi", async () => {
      const staleDate = new Date(Date.now() - 7 * 60 * 60 * 1000)
      const [job] = await givenSomeComputedJobPartners([
        { business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, jobs_in_success: [COMPUTED_ERROR_SOURCE.CLASSIFICATION], updated_at: staleDate },
      ])

      await applyPendingClassificationBatches()

      const released = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(released?.business_error).toBeNull()
      expect(released?.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
    })

    it("ne débloque pas une offre pendante récente", async () => {
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() }])

      await applyPendingClassificationBatches()

      const untouched = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(untouched?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
    })
  })
})
