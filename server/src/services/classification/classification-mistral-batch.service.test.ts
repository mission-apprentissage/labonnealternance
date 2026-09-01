import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { downloadMistralBatchOutput, getMistralBatchJob, submitMistralBatch } from "@/services/mistralai/mistralai.service"

import { applyClassificationBatch, applyPendingClassificationBatches, submitClassificationBatch, submitClassificationRequests } from "./classification-mistral-batch.service"

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

const publishOutput = '{"label":"publish","scores":{"publish":0.9,"unpublish":0.1}}'
const unpublishOutput = '{"label":"unpublish","scores":{"publish":0.1,"unpublish":0.9}}'

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

      const jobIds = await submitClassificationBatch({ _id: job._id })

      expect(jobIds).toEqual(["mistral-job-1"])
      const requests = vi.mocked(submitMistralBatch).mock.calls[0][0].requests
      expect(requests).toHaveLength(1)
      expect(requests[0].customId).toBe(job._id.toString())
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "mistral-job-1" })
      expect(tracked).toMatchObject({ kind: "jobs_partners_classification", status: "submitted", request_count: 1 })
    })

    it("ne soumet rien si le filtre ne matche aucun document", async () => {
      const jobIds = await submitClassificationBatch({ _id: new ObjectId() })

      expect(jobIds).toEqual([])
      expect(submitMistralBatch).not.toHaveBeenCalled()
    })

    it("transmet un timeout court à Mistral : un batch bloqué doit expirer, pas attendre 24 h", async () => {
      // Incident des 30–31/08/2026 : un batch de 20 681 requêtes bloqué à 99,4 % pendant plus de
      // 24 h, sans fichier de sortie tant que le statut n'est pas terminal. Le défaut Mistral
      // (24 h) laissait le catalogue à l'arrêt ; 10 batchs sur 12 mesurés reviennent en < 70 min.
      const [job] = await givenSomeComputedJobPartners([{ offer_title: "Vendeur" }])
      vi.mocked(submitMistralBatch).mockResolvedValue("mistral-job-1")

      await submitClassificationBatch({ _id: job._id })

      expect(vi.mocked(submitMistralBatch).mock.calls[0][0].timeoutHours).toBe(2)
    })
  })

  describe("submitClassificationRequests", () => {
    it("découpe en lots indépendants, un suivi par lot : une requête coincée ne bloque plus que son lot", async () => {
      const jobs = await givenSomeComputedJobPartners(Array.from({ length: 5 }, (_, i) => ({ partner_job_id: `chunk-${i}`, offer_title: `Offre ${i}` })))
      vi.mocked(submitMistralBatch).mockResolvedValueOnce("lot-1").mockResolvedValueOnce("lot-2").mockResolvedValueOnce("lot-3")

      const jobIds = await submitClassificationRequests(jobs, { chunkSize: 2 })

      expect(jobIds).toEqual(["lot-1", "lot-2", "lot-3"])
      const sizes = vi.mocked(submitMistralBatch).mock.calls.map(([{ requests }]) => requests.length)
      expect(sizes).toEqual([2, 2, 1])
      const tracked = await getDbCollection("mistral_batch_jobs").find({}).sort({ job_id: 1 }).toArray()
      expect(tracked.map(({ job_id, request_count }) => ({ job_id, request_count }))).toEqual([
        { job_id: "lot-1", request_count: 2 },
        { job_id: "lot-2", request_count: 2 },
        { job_id: "lot-3", request_count: 1 },
      ])
    })

    it("un lot dont la soumission échoue n'est ni suivi ni compté, les autres passent", async () => {
      const jobs = await givenSomeComputedJobPartners(Array.from({ length: 4 }, (_, i) => ({ partner_job_id: `chunk-ko-${i}`, offer_title: `Offre ${i}` })))
      vi.mocked(submitMistralBatch).mockResolvedValueOnce("lot-1").mockResolvedValueOnce(null)

      const jobIds = await submitClassificationRequests(jobs, { chunkSize: 2 })

      expect(jobIds).toEqual(["lot-1"])
      expect(await getDbCollection("mistral_batch_jobs").countDocuments({})).toBe(1)
    })
  })

  describe("applyPendingClassificationBatches", () => {
    const trackedJob = (jobId: string, requestCount = 1) => ({
      _id: new ObjectId(),
      job_id: jobId,
      kind: "jobs_partners_classification" as const,
      status: "submitted" as const,
      request_count: requestCount,
      applied_count: null,
      error: null,
      submitted_at: new Date(),
      checked_at: null,
      applied_at: null,
    })

    it("job terminé (unpublish) : cache et computed_jobs_partners mis à jour, pipeline re-déclenché, statut applied", async () => {
      // jobs_in_success ne contient PAS encore CLASSIFICATION : un document routé vers le batch
      // par detectClassificationJobsPartners ne l'a jamais eu (il est diverti avant que le
      // chemin sync ne le pousse) — état réaliste au moment où CLASSIFICATION_PENDING est posé.
      const [job] = await givenSomeComputedJobPartners([
        {
          offer_title: "Vendeur",
          workplace_name: "CFA Test",
          business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING,
        },
      ])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ok"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "SUCCESS", outputFile: "file-1" } as never)
      vi.mocked(downloadMistralBatchOutput).mockResolvedValue(new Map([[job._id.toString(), unpublishOutput]]))

      const counters = await applyPendingClassificationBatches()

      expect(counters.applied).toBe(1)
      const cached = await getDbCollection("cache_classification").findOne({ partner_job_id: job.partner_job_id, partner_label: job.partner_label })
      expect(cached).toMatchObject({ classification: "unpublish", model: "mistral:mistral-small-latest" })
      const updated = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(updated?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CFA)
      expect(updated?.jobs_in_success).toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
      expect(addJobMock).toHaveBeenCalledWith({ name: "processJobPartnersWithFilter", payload: { _id: { $in: [job._id] } } })
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-ok" })
      expect(tracked).toMatchObject({ status: "applied", applied_count: 1, error: null })
      // Application complète en SUCCESS : pas d'alerte.
      expect(notifyToSlack).not.toHaveBeenCalled()
    })

    it("job terminé (publish) : jobs_in_success contient CLASSIFICATION — pas de boucle de resoumission", async () => {
      // Régression : un $pull ici laisserait le document éligible au filtre de candidature de
      // detectClassificationJobsPartners (business_error: null ET jobs_in_success sans
      // CLASSIFICATION), ré-déclenché juste après par processJobPartnersWithFilter — pour un gros
      // lot "publish", ça resoumettrait indéfiniment le même batch à chaque ramasse horaire.
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING }])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ok-publish"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "SUCCESS", outputFile: "file-1" } as never)
      vi.mocked(downloadMistralBatchOutput).mockResolvedValue(new Map([[job._id.toString(), publishOutput]]))

      await applyPendingClassificationBatches()

      const updated = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(updated?.business_error).toBeNull()
      expect(updated?.jobs_in_success).toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
      // Reproduit le filtre de candidature de detectClassificationJobsPartners : ce document ne
      // doit plus matcher (sinon il repartirait en CLASSIFICATION_PENDING dès le prochain passage).
      const stillCandidate = await getDbCollection("computed_jobs_partners").countDocuments({
        _id: job._id,
        business_error: null,
        jobs_in_success: { $nin: [COMPUTED_ERROR_SOURCE.CLASSIFICATION] },
      })
      expect(stillCandidate).toBe(0)
    })

    it("job expiré (TIMEOUT_EXCEEDED) avec fichier de sortie : le partiel est appliqué, les réponses manquantes restent PENDING", async () => {
      // Un batch de 20 000 requêtes est otage de sa pire requête : les 99,4 % traités doivent
      // servir. Les offres sans réponse restent CLASSIFICATION_PENDING et seront relancées par le
      // filet de sécurité — jamais annulées, jamais abandonnées.
      const [answered, missing] = await givenSomeComputedJobPartners([
        { partner_job_id: "answered", offer_title: "Répondue", business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() },
        { partner_job_id: "missing", offer_title: "Coincée", business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() },
      ])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-timeout", 2))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "TIMEOUT_EXCEEDED", outputFile: "file-partial" } as never)
      vi.mocked(downloadMistralBatchOutput).mockResolvedValue(new Map([[answered._id.toString(), publishOutput]]))

      const counters = await applyPendingClassificationBatches()

      expect(counters).toMatchObject({ applied: 1, failed: 0 })
      const appliedDoc = await getDbCollection("computed_jobs_partners").findOne({ _id: answered._id })
      expect(appliedDoc?.business_error).toBeNull()
      expect(appliedDoc?.jobs_in_success).toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
      const missingDoc = await getDbCollection("computed_jobs_partners").findOne({ _id: missing._id })
      expect(missingDoc?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
      expect(addJobMock).toHaveBeenCalledWith({ name: "processJobPartnersWithFilter", payload: { _id: { $in: [answered._id] } } })
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-timeout" })
      expect(tracked).toMatchObject({ status: "applied", applied_count: 1, error: "TIMEOUT_EXCEEDED" })
      // Application partielle : signalée, sans être une erreur bloquante.
      expect(notifyToSlack).toHaveBeenCalledOnce()
      expect(vi.mocked(notifyToSlack).mock.calls[0][0]).toMatchObject({ error: false })
    })

    it("job en échec terminal sans sortie : statut failed + alerte Slack, le document reste bloqué (repris par le filet de sécurité)", async () => {
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() }])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-ko"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "FAILED", outputFile: null } as never)

      const counters = await applyPendingClassificationBatches()

      expect(counters.failed).toBe(1)
      expect(notifyToSlack).toHaveBeenCalledOnce()
      expect(vi.mocked(notifyToSlack).mock.calls[0][0]).toMatchObject({ error: true })
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-ko" })
      expect(tracked).toMatchObject({ status: "failed", error: "FAILED" })
      const stillPending = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(stillPending?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
      expect(addJobMock).not.toHaveBeenCalled()
    })

    it("job encore en cours sans sortie : rien n'est appliqué, on repassera", async () => {
      // Cas réel du 31/08/2026 : RUNNING avec 20 560/20 681 requêtes traitées et output_file null.
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() }])
      await getDbCollection("mistral_batch_jobs").insertOne(trackedJob("job-running"))
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "RUNNING", outputFile: null, completedRequests: 20_560, totalRequests: 20_681 } as never)

      const counters = await applyPendingClassificationBatches()

      expect(counters).toMatchObject({ applied: 0, stillRunning: 1, failed: 0 })
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-running" })
      expect(tracked).toMatchObject({ status: "submitted" })
      expect(tracked?.checked_at).not.toBeNull()
      const stillPending = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(stillPending?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
    })

    it("filet de sécurité : débloque une offre pendante depuis plus de 6h, même sans job suivi, ET relance son traitement", async () => {
      // Avant : la libération remettait business_error à null sans rien relancer. Une offre déjà
      // dotée d'un code ROME n'était alors reprise par aucun job avant la nuit suivante — 16 147
      // offres Hellowork et France Travail bloquées ainsi en prod le 01/09/2026.
      const staleDate = new Date(Date.now() - 7 * 60 * 60 * 1000)
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: staleDate }])

      await applyPendingClassificationBatches()

      const released = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(released?.business_error).toBeNull()
      expect(released?.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
      expect(addJobMock).toHaveBeenCalledWith({ name: "processJobPartnersWithFilter", payload: { _id: { $in: [job._id] } } })
    })

    it("ne débloque pas une offre pendante récente", async () => {
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() }])

      await applyPendingClassificationBatches()

      const untouched = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(untouched?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
      expect(addJobMock).not.toHaveBeenCalled()
    })
  })

  describe("applyClassificationBatch (levier d'incident)", () => {
    it("applique un job non suivi dès qu'un fichier de sortie existe, quel que soit le statut Mistral", async () => {
      // Nuit du 30/08/2026 : traitement tué pendant la soumission, aucun suivi enregistré.
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING }])
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "RUNNING", outputFile: "file-force", totalRequests: 1 } as never)
      vi.mocked(downloadMistralBatchOutput).mockResolvedValue(new Map([[job._id.toString(), unpublishOutput]]))

      const result = await applyClassificationBatch({ jobId: "job-untracked" })

      expect(result).toMatchObject({ status: "RUNNING", applied: 1, requested: 1 })
      const updated = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(updated?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CFA)
      const tracked = await getDbCollection("mistral_batch_jobs").findOne({ job_id: "job-untracked" })
      expect(tracked).toMatchObject({ status: "applied", applied_count: 1, error: "RUNNING" })
      expect(addJobMock).toHaveBeenCalledWith({ name: "processJobPartnersWithFilter", payload: { _id: { $in: [job._id] } } })
    })

    it("sans fichier de sortie, ne touche à rien et le dit", async () => {
      const [job] = await givenSomeComputedJobPartners([{ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING }])
      vi.mocked(getMistralBatchJob).mockResolvedValue({ status: "RUNNING", outputFile: null } as never)

      const result = await applyClassificationBatch({ jobId: "job-no-output" })

      expect(result).toMatchObject({ status: "RUNNING", applied: 0 })
      expect(downloadMistralBatchOutput).not.toHaveBeenCalled()
      expect(addJobMock).not.toHaveBeenCalled()
      const untouched = await getDbCollection("computed_jobs_partners").findOne({ _id: job._id })
      expect(untouched?.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING)
    })

    it("exige un jobId", async () => {
      await expect(applyClassificationBatch({})).rejects.toThrow(/--jobId requis/)
    })
  })
})
