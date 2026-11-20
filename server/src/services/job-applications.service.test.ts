import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { ApplicationIntention } from "shared/constants/application"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import type { ComputedUserAccess } from "shared/models/index"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { exportJobApplicationsForRecruiter, getJobApplicationsForRecruiter } from "./job-applications.service"

useMongo()

const recruiterId = new ObjectId()
const recruiterAccess: ComputedUserAccess = { admin: false, users: [recruiterId.toString()], cfas: [], entreprises: [new ObjectId().toString()], opcos: [], partner_label: [] }

const insertJob = async (data: Parameters<typeof generateJobsPartnersOfferPrivate>[0] = {}) => {
  const job = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: recruiterId,
    offer_expiration: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    ...data,
  })
  await getDbCollection("jobs_partners").insertOne(job)
  return job
}

const insertApplication = async (jobId: ObjectId, data: Parameters<typeof generateApplicationFixture>[0], applicant?: { firstname: string; lastname: string }) => {
  const applicantDoc = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr`, ...applicant })
  if (applicant) {
    await getDbCollection("applicants").insertOne(applicantDoc)
  }
  const application = generateApplicationFixture({ job_id: jobId, applicant_id: applicantDoc._id, ...data })
  await getDbCollection("applications").insertOne(application)
  return application
}

describe("getJobApplicationsForRecruiter", () => {
  it("renvoie les candidatures de l'offre, les plus récentes d'abord, avec le nom du candidat", async () => {
    const job = await insertJob()
    const otherJob = await insertJob()
    const older = await insertApplication(
      job._id,
      { created_at: new Date("2026-10-01T10:00:00.000Z"), company_recruitment_intention: ApplicationIntention.REFUS },
      { firstname: "Alex", lastname: "Exemple" }
    )
    const newer = await insertApplication(
      job._id,
      { created_at: new Date("2026-11-01T10:00:00.000Z"), company_recruitment_intention: null },
      { firstname: "Sam", lastname: "Test" }
    )
    await insertApplication(otherJob._id, { created_at: new Date("2026-11-02T10:00:00.000Z") }, { firstname: "Lou", lastname: "Autre" })

    const result = await getJobApplicationsForRecruiter(job._id, recruiterAccess)

    expect(result.job._id).toEqual(job._id)
    expect(result.applications).toEqual([
      { _id: newer._id, applicant_first_name: "Sam", applicant_last_name: "Test", company_recruitment_intention: null, created_at: new Date("2026-11-01T10:00:00.000Z") },
      { _id: older._id, applicant_first_name: "Alex", applicant_last_name: "Exemple", company_recruitment_intention: "refus", created_at: new Date("2026-10-01T10:00:00.000Z") },
    ])
  })

  it("écarte les candidatures dont le candidat a été anonymisé", async () => {
    const job = await insertJob()
    await insertApplication(job._id, {})

    const result = await getJobApplicationsForRecruiter(job._id, recruiterAccess)

    expect(result.applications).toEqual([])
  })

  it("refuse un OPCO, même s'il a accès à l'offre par son OPCO de rattachement", async () => {
    const job = await insertJob()
    const opcoAccess: ComputedUserAccess = { admin: false, users: [new ObjectId().toString()], cfas: [], entreprises: [], opcos: [OPCOS_LABEL.AKTO], partner_label: [] }

    await expect(getJobApplicationsForRecruiter(job._id, opcoAccess)).rejects.toThrow("Accès réservé au recruteur de l'offre")
  })

  it("ne renvoie plus les candidatures plus de trois mois après l'expiration de l'offre, et refuse leur export", async () => {
    const job = await insertJob({ offer_expiration: new Date(Date.now() - 100 * 24 * 3600 * 1000) })
    await insertApplication(job._id, {}, { firstname: "Expire", lastname: "Candidat" })

    const { job: returnedJob, applications } = await getJobApplicationsForRecruiter(job._id, recruiterAccess)
    expect(returnedJob.offer_title).toBe(job.offer_title)
    expect(applications).toEqual([])
    await expect(exportJobApplicationsForRecruiter(job._id, recruiterAccess)).rejects.toThrow("Les candidatures de cette offre ne sont plus consultables")
  })

  it("compte les trois mois depuis la clôture d'une offre pourvue, même avant son expiration", async () => {
    const closedAt = new Date(Date.now() - 100 * 24 * 3600 * 1000)
    const job = await insertJob({
      offer_status: JOB_STATUS_ENGLISH.POURVUE,
      offer_status_history: [{ status: JOB_STATUS_ENGLISH.POURVUE, date: closedAt, reason: "Offre pourvue", granted_by: "recruteur" }],
      offer_expiration: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    })
    await insertApplication(job._id, {}, { firstname: "Pourvue", lastname: "Candidat" })

    expect((await getJobApplicationsForRecruiter(job._id, recruiterAccess)).applications).toEqual([])
  })

  it("renvoie la clôture d'une offre pourvue, pour le bandeau de fin de consultation", async () => {
    const closedAt = new Date(Date.now() - 10 * 24 * 3600 * 1000)
    const job = await insertJob({
      offer_status: JOB_STATUS_ENGLISH.POURVUE,
      offer_status_history: [{ status: JOB_STATUS_ENGLISH.POURVUE, date: closedAt, reason: "Offre pourvue", granted_by: "recruteur" }],
    })

    expect((await getJobApplicationsForRecruiter(job._id, recruiterAccess)).job.closure).toEqual({ reason: "filled", date: closedAt })
  })

  it("répond 404 pour une offre qui n'est pas une offre LBA", async () => {
    const job = await insertJob({ partner_label: JOBPARTNERS_LABEL.HELLOWORK })

    await expect(getJobApplicationsForRecruiter(job._id, recruiterAccess)).rejects.toThrow("Offre introuvable")
  })
})
