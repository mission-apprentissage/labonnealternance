import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateJobsPartnersFull } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { describe, expect, it, vi } from "vitest"
import { CLASSIFICATION_MISTRAL_MODEL } from "@/common/apis/classification/classification-mistral.client"
import { mistralClassificationResponse } from "@/common/apis/classification/classification-mistral.client.fixture"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"
import type { TJobClassification } from "./cache-classification.service"
import { getCachedClassificationsByPairs, getClassification, updateClassificationAndSynchronise } from "./cache-classification.service"

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: vi.fn().mockResolvedValue(undefined) }
})

vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn(),
}))

const insertCacheClassification = async (data: { partner_label: string; partner_job_id: string; classification: string; human_verification?: "publish" | "unpublish" | null }) => {
  await getDbCollection("cache_classification").insertOne({
    _id: new ObjectId(),
    partner_label: data.partner_label,
    partner_job_id: data.partner_job_id,
    classification: data.classification,
    human_verification: data.human_verification ?? null,
    scores: { publish: 0.5, unpublish: 0.5 },
    model: "test-model",
    created_at: new Date(),
  })
}

describe("getClassification", () => {
  useMongo()

  const jobFixture = generateJobsPartnersFull({
    workplace_name: "CFA",
    workplace_description: "CFA",
    offer_title: "Software Engineer",
    offer_description: "Software Engineer",
  })
  const payload: TJobClassification = {
    partner_job_id: jobFixture.partner_job_id,
    partner_label: jobFixture.partner_label,
    workplace_name: jobFixture.workplace_name!,
    workplace_description: jobFixture.workplace_description!,
    offer_title: jobFixture.offer_title,
    offer_description: jobFixture.offer_description,
  }

  it("appelle le provider avec les offres non cachées (ids = index) et retourne son label", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralClassificationResponse([{ id: "0", label: "unpublish" }]))

    expect(await getClassification([payload])).toEqual(["unpublish"])

    // Le payload envoyé au provider est la liste des offres non cachées, identifiées par leur index.
    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const userMessage = messages.find((message) => message.role === "user")
    expect(JSON.parse(userMessage!.content)).toEqual([
      {
        id: "0",
        workplace_name: payload.workplace_name,
        workplace_description: payload.workplace_description,
        offer_title: payload.offer_title,
        offer_description: payload.offer_description,
      },
    ])
  })

  it("priorise human_verification sur classification pour une offre cachée, dans un lot mixte", async () => {
    const cachedJob = generateJobsPartnersFull({
      workplace_name: "CFA",
      workplace_description: "CFA",
      offer_title: "Cached Job",
      offer_description: "Cached Job",
    })
    const cachedPayload: TJobClassification = {
      partner_job_id: cachedJob.partner_job_id,
      partner_label: cachedJob.partner_label,
      workplace_name: cachedJob.workplace_name!,
      workplace_description: cachedJob.workplace_description!,
      offer_title: cachedJob.offer_title,
      offer_description: cachedJob.offer_description,
    }
    await getDbCollection("cache_classification").insertOne({
      _id: new ObjectId(),
      partner_label: cachedJob.partner_label,
      partner_job_id: cachedJob.partner_job_id,
      classification: "publish",
      human_verification: "unpublish",
      scores: { publish: 0.9, unpublish: 0.1 },
      model: "model",
      created_at: new Date(),
    })

    // Seule l'offre non cachée part au provider ; elle garde son index d'origine ("1") comme id.
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralClassificationResponse([{ id: "1", label: "unpublish" }]))

    const result = await getClassification([cachedPayload, payload])
    expect(result[0]).toBe("unpublish")
    expect(result[1]).toBe("unpublish")
    const [{ messages }] = vi.mocked(sendMistralMessages).mock.calls[0]
    const userMessage = messages.find((message) => message.role === "user")
    expect(JSON.parse(userMessage!.content)).toHaveLength(1)
  })

  it("mappe les résultats par index quand deux offres partagent les mêmes identifiants partenaire", async () => {
    const duplicatedPartnerJobId = `duplicate-${jobFixture.partner_job_id}`
    const duplicatedPartnerLabel = `duplicate-${jobFixture.partner_label}`
    const duplicatedPayloads: TJobClassification[] = [
      { ...payload, partner_job_id: duplicatedPartnerJobId, partner_label: duplicatedPartnerLabel, offer_title: "First duplicated job" },
      { ...payload, partner_job_id: duplicatedPartnerJobId, partner_label: duplicatedPartnerLabel, offer_title: "Second duplicated job" },
    ]

    vi.mocked(sendMistralMessages).mockResolvedValue(
      mistralClassificationResponse([
        { id: "0", label: "publish", scores: { publish: 0.9, unpublish: 0.1 } },
        { id: "1", label: "unpublish", scores: { publish: 0.1, unpublish: 0.9 } },
      ])
    )

    expect(await getClassification(duplicatedPayloads)).toEqual(["publish", "unpublish"])
  })

  it("stocke model et created_at dans le cache à l'enregistrement d'une classification", async () => {
    const before = new Date()
    vi.mocked(sendMistralMessages).mockResolvedValue(mistralClassificationResponse([{ id: "0", label: "unpublish" }]))

    await getClassification([payload])

    const cached = await getDbCollection("cache_classification").findOne({ partner_job_id: jobFixture.partner_job_id })
    expect(cached).not.toBeNull()
    expect(cached!.model).toBe(`mistral:${CLASSIFICATION_MISTRAL_MODEL}`)
    expect(cached!.created_at).toBeInstanceOf(Date)
    expect(cached!.created_at!.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })
})

describe("updateClassificationAndSynchronise", () => {
  useMongo()

  it("annule l'offre quand la vérification humaine diffère de la classification du modèle", async () => {
    const jobPartner = await createJobPartner({ partner_label: "Meteojob", partner_job_id: "1234", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await insertCacheClassification({ partner_label: "Meteojob", partner_job_id: "1234", classification: "publish" })

    await updateClassificationAndSynchronise({ classification: "unpublish", jobs: [{ partner_label: "Meteojob", partner_job_id: "1234" }], grantedBy: "test@beta.gouv.fr" })

    const updatedEntry = await getDbCollection("cache_classification").findOne({ partner_label: "Meteojob", partner_job_id: "1234" })
    expect(updatedEntry?.human_verification).toEqual("unpublish")

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobPartner._id })
    expect(updatedJob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
    expect(updatedJob?.offer_status_history.at(-1)).toMatchObject({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: "classification humaine non conforme",
      granted_by: "test@beta.gouv.fr",
    })
  })

  it("ne modifie pas la classification ni l'offre d'un autre partenaire partageant le même partner_job_id", async () => {
    const sharedPartnerJobId = "5678"
    const jobMeteojob = await createJobPartner({ partner_label: "Meteojob", partner_job_id: sharedPartnerJobId, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    const jobApec = await createJobPartner({ partner_label: "APEC", partner_job_id: sharedPartnerJobId, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await insertCacheClassification({ partner_label: "Meteojob", partner_job_id: sharedPartnerJobId, classification: "publish" })
    await insertCacheClassification({ partner_label: "APEC", partner_job_id: sharedPartnerJobId, classification: "publish" })

    await updateClassificationAndSynchronise({ classification: "unpublish", jobs: [{ partner_label: "Meteojob", partner_job_id: sharedPartnerJobId }] })

    const entryMeteojob = await getDbCollection("cache_classification").findOne({ partner_label: "Meteojob", partner_job_id: sharedPartnerJobId })
    const entryApec = await getDbCollection("cache_classification").findOne({ partner_label: "APEC", partner_job_id: sharedPartnerJobId })
    expect(entryMeteojob?.human_verification).toEqual("unpublish")
    expect(entryApec?.human_verification).toBeNull()
    expect(entryApec?.classification).toEqual("publish")

    const updatedJobMeteojob = await getDbCollection("jobs_partners").findOne({ _id: jobMeteojob._id })
    const updatedJobApec = await getDbCollection("jobs_partners").findOne({ _id: jobApec._id })
    expect(updatedJobMeteojob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
    expect(updatedJobApec?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("ne touche pas l'offre quand la classification du modèle correspond déjà à la vérification demandée", async () => {
    const jobPartner = await createJobPartner({ partner_label: "Meteojob", partner_job_id: "9999", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await insertCacheClassification({ partner_label: "Meteojob", partner_job_id: "9999", classification: "unpublish" })

    await updateClassificationAndSynchronise({ classification: "unpublish", jobs: [{ partner_label: "Meteojob", partner_job_id: "9999" }] })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobPartner._id })
    expect(updatedJob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("ne fait rien quand aucune entrée cache_classification ne correspond", async () => {
    const jobPartner = await createJobPartner({ partner_label: "Meteojob", partner_job_id: "no-entry", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    await expect(updateClassificationAndSynchronise({ classification: "unpublish", jobs: [{ partner_label: "Meteojob", partner_job_id: "no-entry" }] })).resolves.not.toThrow()

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobPartner._id })
    expect(updatedJob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })
})

describe("getCachedClassificationsByPairs", () => {
  useMongo()

  it("lit le cache par couple (partner_label, partner_job_id) : un même partner_job_id chez deux partenaires reste distinct", async () => {
    // Faux positif à éviter : un `$in` sur partner_job_id seul renverrait la classification d'un autre
    // partenaire pour le même identifiant.
    await insertCacheClassification({ partner_label: "Hellowork", partner_job_id: "shared-1", classification: "publish" })
    await insertCacheClassification({ partner_label: "Meteojob", partner_job_id: "shared-1", classification: "unpublish" })
    await insertCacheClassification({ partner_label: "Hellowork", partner_job_id: "human-1", classification: "publish", human_verification: "unpublish" })

    const cached = await getCachedClassificationsByPairs([
      { partner_label: "Hellowork", partner_job_id: "shared-1" },
      { partner_label: "Meteojob", partner_job_id: "shared-1" },
      { partner_label: "Hellowork", partner_job_id: "human-1" },
      { partner_label: "Hellowork", partner_job_id: "absent-1" },
      { partner_label: "Jobteaser", partner_job_id: "shared-1" },
    ])

    expect(cached).toEqual(
      new Map([
        ["Hellowork::shared-1", "publish"],
        ["Meteojob::shared-1", "unpublish"],
        // La vérification humaine prime sur la classification du modèle, comme dans getClassification.
        ["Hellowork::human-1", "unpublish"],
      ])
    )
  })

  it("retourne une Map vide sans entrée demandée", async () => {
    expect(await getCachedClassificationsByPairs([])).toEqual(new Map())
  })
})
