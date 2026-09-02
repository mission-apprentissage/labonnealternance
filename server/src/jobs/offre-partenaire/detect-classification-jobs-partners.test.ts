import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import GEIQ_WHITELIST from "shared/constants/geiq"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mistralClassificationResponse } from "@/common/apis/classification/classification-mistral.client.fixture"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { submitClassificationRequests } from "@/services/classification/classification-mistral-batch.service"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"
import { detectClassificationJobsPartners as detectClassificationJobsPartnersRaw } from "./detect-classification-jobs-partners"

vi.mock("@/services/classification/classification-mistral-batch.service", () => ({
  submitClassificationRequests: vi.fn(),
}))

vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn(),
}))

const detectClassificationJobsPartners = async () => detectClassificationJobsPartnersRaw({})

const offer_title = "vendeur / vendeuse"
const workplace_name = "decathlon"
const workplace_description = "description d'un magasin decathlon"
const offer_description = "description d'une offre de vendeur"
const partner_job_id = "partner_job_id"

describe("detect-classification-jobs-partners", () => {
  useMongo()

  beforeEach(() => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralClassificationResponse([{ id: "0", label: "publish", scores: { publish: 0.6, unpublish: 0.4 } }]))
    vi.mocked(submitClassificationRequests).mockResolvedValue([])
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("cache_classification").deleteMany({})
    }
  })

  const cacheEntry = (job: { partner_label: string; partner_job_id: string }, classification: "publish" | "unpublish", human_verification?: "publish" | "unpublish") => ({
    _id: new ObjectId(),
    partner_label: job.partner_label,
    partner_job_id: job.partner_job_id,
    classification,
    scores: { publish: classification === "publish" ? 0.9 : 0.1, unpublish: classification === "publish" ? 0.1 : 0.9 },
    model: "mistral:test",
    created_at: new Date(),
    ...(human_verification ? { human_verification } : {}),
  })

  it("should pass on a job partner with all fields", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
        workplace_name,
        workplace_description,
        offer_description,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })

  it("should pass on a job partner with only a title", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })
  it("should pass on a job partner with only a workplace name", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        workplace_name,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })
  it("should pass on a job partner with only a workplace description", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        workplace_description,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })
  it("should pass on a job partner with only an offer description", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_description,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })

  it("should set business_error to CFA when classification is 'unpublish'", async () => {
    // given
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralClassificationResponse([{ id: "0", label: "unpublish", scores: { publish: 0.3, unpublish: 0.7 } }]))
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
        workplace_name,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA)
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })

  it("should NOT classify an offer from a company in the GEIQ whitelist", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
        workplace_name,
        workplace_siret: GEIQ_WHITELIST[0],
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(false)
  })

  it("sert les offres déjà présentes dans cache_classification sans appel Mistral, la vérification humaine primant", async () => {
    // computed_jobs_partners est reconstruit chaque nuit : sans cette étape, tout le catalogue déjà
    // classé repartait vers Mistral (~20 000 requêtes/nuit mesurées en prod le 01/09/2026).
    const [cachedPublish, cachedUnpublish, unknown] = await givenSomeComputedJobPartners([
      { partner_job_id: "cached-publish", offer_title, workplace_name },
      { partner_job_id: "cached-unpublish", offer_title, workplace_name },
      { partner_job_id: "unknown", offer_title, workplace_name },
    ])
    await getDbCollection("cache_classification").insertMany([cacheEntry(cachedPublish, "publish"), cacheEntry(cachedUnpublish, "publish", "unpublish")])

    await detectClassificationJobsPartners()

    const publish = await getDbCollection("computed_jobs_partners").findOne({ _id: cachedPublish._id })
    expect.soft(publish?.business_error).toBeNull()
    expect.soft(publish?.jobs_in_success).toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
    const unpublish = await getDbCollection("computed_jobs_partners").findOne({ _id: cachedUnpublish._id })
    expect.soft(unpublish?.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA)
    expect.soft(unpublish?.jobs_in_success).toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
    // Seule l'offre inconnue du cache part vers Mistral (chemin sync, un seul groupe).
    expect.soft(sendMistralMessages).toHaveBeenCalledTimes(1)
    const unknownDoc = await getDbCollection("computed_jobs_partners").findOne({ _id: unknown._id })
    expect.soft(unknownDoc?.jobs_in_success).toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
    expect(submitClassificationRequests).not.toHaveBeenCalled()
  })

  it("le seuil sync/batch ne compte que les offres absentes du cache", async () => {
    // 501 candidats dont 2 en cache : 499 inconnus → sous le seuil → chemin sync, aucun batch, aucune
    // offre marquée CLASSIFICATION_PENDING. Sans le cache d'abord, le même lot partait en batch.
    const jobs = await givenSomeComputedJobPartners(Array.from({ length: 501 }, (_, i) => ({ partner_job_id: `bulk-${i}`, offer_title, workplace_name })))
    await getDbCollection("cache_classification").insertMany(jobs.slice(0, 2).map((job) => cacheEntry(job, "publish")))
    // Le chemin sync interroge Mistral par groupes de 50, ids "0".."49" : un id sans réponse fait
    // échouer tout le groupe (getMistralClassificationBatch), il faut donc répondre pour chacun.
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralClassificationResponse(Array.from({ length: 50 }, (_, i) => ({ id: String(i), label: "publish" as const }))))

    await detectClassificationJobsPartners()

    expect.soft(submitClassificationRequests).not.toHaveBeenCalled()
    expect.soft(sendMistralMessages).toHaveBeenCalled()
    const pendingCount = await getDbCollection("computed_jobs_partners").countDocuments({ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING })
    expect.soft(pendingCount).toBe(0)
    const classifiedCount = await getDbCollection("computed_jobs_partners").countDocuments({ jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION })
    expect(classifiedCount).toBe(501)
  }, 15_000)

  it("sert plus de 1 000 offres depuis le cache en plusieurs groupes de lecture, sans aucun appel Mistral", async () => {
    // Au-delà de CACHE_LOOKUP_GROUP_SIZE (1 000), le curseur est vidé en cours d'itération pendant que
    // les groupes précédents ont déjà modifié business_error et jobs_in_success : chaque offre doit
    // être servie exactement une fois (ordre nominal en prod : ~20 000 offres déjà classées par nuit).
    const jobs = await givenSomeComputedJobPartners(Array.from({ length: 1_001 }, (_, i) => ({ partner_job_id: `cached-${i}`, offer_title, workplace_name })))
    await getDbCollection("cache_classification").insertMany(jobs.map((job, i) => cacheEntry(job, i % 10 === 0 ? "unpublish" : "publish")))

    const result = await detectClassificationJobsPartners()

    expect.soft(result).toMatchObject({ total: 1_001, success: 1_001, from_cache: 1_001, batched: 0, batches: 0 })
    expect.soft(sendMistralMessages).not.toHaveBeenCalled()
    expect.soft(submitClassificationRequests).not.toHaveBeenCalled()
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION })).toBe(1_001)
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ business_error: JOB_PARTNER_BUSINESS_ERROR.CFA })).toBe(101)
    expect(await getDbCollection("computed_jobs_partners").countDocuments({ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING })).toBe(0)
  }, 15_000)

  it("should route the whole batch to Mistral batch (CLASSIFICATION_PENDING) when candidate volume exceeds the sync threshold", async () => {
    // given: > 500 candidats (seuil sync/batch) : la voie batch ne doit pas appeler l'API Mistral synchrone.
    const jobs = Array.from({ length: 501 }, (_, i) => ({
      partner_job_id: `bulk-${i}`,
      offer_title,
      workplace_name,
    }))
    await givenSomeComputedJobPartners(jobs)
    // when
    await detectClassificationJobsPartners()
    // then
    const pendingCount = await getDbCollection("computed_jobs_partners").countDocuments({ business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING })
    expect(pendingCount).toBe(501)
    // Un seul aller-retour Mongo pour construire les requêtes batch : les documents déjà chargés
    // sont passés directement, pas un filtre à refetcher (cf. commentaire Copilot sur la PR).
    expect(submitClassificationRequests).toHaveBeenCalledTimes(1)
    const docs = vi.mocked(submitClassificationRequests).mock.calls[0][0]
    expect(docs).toHaveLength(501)
    expect(sendMistralMessages).not.toHaveBeenCalled()
  }, 15_000)
})
