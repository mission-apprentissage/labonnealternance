import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveRecruiter, saveUserWithAccount } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { RECRUITER_STATUS } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { applicationTestFile, generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { ApplicationScanStatus, JOB_STATUS } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import mailer from "@/services/mailer.service"
import { processApplications } from "./processApplications"

// Mock ClamAV to be available and not detect viruses
vi.mock("@/services/clamav.service", () => ({
  isClamavAvailable: vi.fn().mockResolvedValue(true),
  isInfected: vi.fn().mockResolvedValue(false),
}))

// Mock S3 to avoid actual AWS calls
vi.mock("@/common/utils/awsUtils", () => ({
  s3WriteString: vi.fn().mockResolvedValue(undefined),
  s3ReadAsString: vi.fn().mockResolvedValue(applicationTestFile),
  s3Delete: vi.fn().mockResolvedValue(undefined),
}))

// Mock mailer to avoid sending actual emails
vi.mock("@/services/mailer.service", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }),
    renderEmail: vi.fn().mockResolvedValue("<html>Test Email</html>"),
  },
}))

// Mock Slack notifications
vi.mock("@/common/utils/slackUtils", () => ({
  notifyToSlack: vi.fn().mockResolvedValue(undefined),
}))

// Mock axios to avoid actual HTTP calls (used by Taleez API integration)
// Using importOriginal to preserve axios.create() which is used by other services at module init time
vi.mock("axios", async (importOriginal) => {
  const mod = await importOriginal<typeof import("axios")>()
  return {
    ...mod,
    default: {
      ...mod.default,
      post: vi.fn().mockResolvedValue({ status: 200, data: {} }),
    },
  }
})

useMongo()

describe("processApplications", () => {
  const mailerSendEmailSpy = vi.mocked(mailer.sendEmail)

  beforeEach(async () => {
    mailerSendEmailSpy.mockClear()
  })

  it("should process recruteur_lba application and save correct data to DB", async () => {
    const jobId = new ObjectId()
    const applicant = generateApplicantFixture({ email: "candidat@test.fr" })
    await getDbCollection("applicants").insertOne(applicant)

    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        _id: jobId,
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        apply_email: "company@test.fr",
        workplace_siret: "12345678901234",
      })
    )

    const application = generateApplicationFixture({
      applicant_id: applicant._id,
      job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA,
      job_id: jobId,
      company_email: "company@test.fr",
      company_siret: "12345678901234",
      to_company_message_id: null,
      to_applicant_message_id: null,
      scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
    })
    await getDbCollection("applications").insertOne(application)

    await processApplications()

    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    // Scan should complete without detecting a virus
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    // Both applicant and company emails should be sent
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
    // Both emails should have been sent (company + applicant)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
  })

  it("should process offres_emploi_lba application and save correct data to DB", async () => {
    const jobId = new ObjectId()
    const userId = new ObjectId()

    const applicant = generateApplicantFixture({ email: "candidat@test.fr" })
    await getDbCollection("applicants").insertOne(applicant)

    await saveUserWithAccount({ _id: userId })
    await saveRecruiter(
      generateRecruiterFixture({
        managed_by: userId.toString(),
        email: "recruiter@company.fr",
        status: RECRUITER_STATUS.ACTIF,
        establishment_siret: "12345678901234",
        jobs: [{ _id: jobId, rome_code: ["A1101"], job_status: JOB_STATUS.ACTIVE }],
      })
    )

    const application = generateApplicationFixture({
      applicant_id: applicant._id,
      job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
      job_id: jobId,
      company_email: "recruiter@company.fr",
      to_company_message_id: null,
      to_applicant_message_id: null,
      scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
    })
    await getDbCollection("applications").insertOne(application)

    await processApplications()

    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    // Scan should complete without detecting a virus
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    // Both applicant and company emails should be sent
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
    // Both emails should have been sent (company + applicant)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
  })

  it("should process Taleez application, call Taleez API, send applicant message, and not set to_company_message_id", async () => {
    const jobId = new ObjectId()
    const applicant = generateApplicantFixture({ email: "candidat@test.fr" })
    await getDbCollection("applicants").insertOne(applicant)

    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        _id: jobId,
        partner_label: "Taleez",
        partner_job_id: "taleez_job_123",
        apply_email: "taleez@company.fr",
      })
    )

    const application = generateApplicationFixture({
      applicant_id: applicant._id,
      job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
      job_id: jobId,
      company_email: "taleez@company.fr",
      to_company_message_id: null,
      to_applicant_message_id: null,
      scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
    })
    await getDbCollection("applications").insertOne(application)

    const axios = await import("axios")
    vi.mocked(axios.default.post).mockClear()

    await processApplications()

    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    // Scan should complete without detecting a virus
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    // Taleez API should be called instead of sending a company email
    expect(vi.mocked(axios.default.post)).toHaveBeenCalledOnce()
    // to_company_message_id should remain null (Taleez handles the company notification)
    expect(updatedApplication?.to_company_message_id).toEqual("Taleez")
    // Applicant email should be sent
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
    // Only applicant email should be sent (not company email)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(1)
    expect(mailerSendEmailSpy.mock.calls[0][0]).toMatchObject({ to: applicant.email })
  })

  it("should process other partner_label application and save correct data to DB", async () => {
    const jobId = new ObjectId()
    const applicant = generateApplicantFixture({ email: "candidat@test.fr" })
    await getDbCollection("applicants").insertOne(applicant)

    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        _id: jobId,
        partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
        apply_email: "company@francetravail.fr",
      })
    )

    const application = generateApplicationFixture({
      applicant_id: applicant._id,
      job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
      job_id: jobId,
      company_email: "company@francetravail.fr",
      to_company_message_id: null,
      to_applicant_message_id: null,
      scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
    })
    await getDbCollection("applications").insertOne(application)

    await processApplications()

    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    // Scan should complete without detecting a virus
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    // Both applicant and company emails should be sent
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
    // Both emails should have been sent (company + applicant)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
  })
})
