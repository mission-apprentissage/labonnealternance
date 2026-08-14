import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { updateClassificationAndSynchronise } from "./cache-classification.service"

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: vi.fn().mockResolvedValue(undefined) }
})

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
