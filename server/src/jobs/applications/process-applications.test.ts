import { useMongo } from "@tests/utils/mongo.test.utils"
import { AxiosError, type AxiosResponse } from "axios"
import { ObjectId } from "bson"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { applicationTestFile, generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { ApplicationScanStatus, JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { PARTNER_CLOSED_JOB_REASON, PartnerJobClosedError } from "@/services/application.service"
import { isInfected } from "@/services/clamav.service"
import mailer from "@/services/mailer.service"
import { syncJobPartnersToSearchItemsInBackground } from "@/services/search/search-items.service"
import { processApplications } from "./process-applications"

vi.mock("@/services/clamav.service", () => ({
  isClamavAvailable: vi.fn().mockResolvedValue(true),
  isInfected: vi.fn().mockResolvedValue(false),
}))

vi.mock("@/common/utils/aws-utils", () => ({
  s3WriteString: vi.fn().mockResolvedValue(undefined),
  s3ReadAsString: vi.fn().mockResolvedValue(applicationTestFile),
  s3Delete: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/services/mailer.service", () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }),
    renderEmail: vi.fn().mockResolvedValue("<html>Test Email</html>"),
  },
}))

vi.mock("@/common/utils/sentry-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/sentry-utils")>()),
  sentryCaptureException: vi.fn(),
}))

vi.mock("@/services/search/search-items.service", () => ({
  syncJobPartnersToSearchItemsInBackground: vi.fn(),
}))

vi.mock("@/common/utils/slack-utils", () => ({
  notifyToSlack: vi.fn().mockResolvedValue(undefined),
}))

// importOriginal preserves axios.create(), which other services call at module init time
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

describe("process-applications", () => {
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
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
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
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    // Taleez notifies the company itself: no company email, to_company_message_id holds the partner label
    expect(vi.mocked(axios.default.post)).toHaveBeenCalledOnce()
    expect(updatedApplication?.to_company_message_id).toEqual("Taleez")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(1)
    expect(mailerSendEmailSpy.mock.calls[0][0]).toMatchObject({ to: applicant.email })
  })

  describe("Taleez API error", () => {
    const offerExpiration = new Date("2027-01-08T23:00:00.000Z")

    const setupTaleezApplication = async () => {
      const jobId = new ObjectId()
      const applicant = generateApplicantFixture({ email: "candidat@test.fr" })
      await getDbCollection("applicants").insertOne(applicant)
      await getDbCollection("jobs_partners").insertOne(
        generateJobsPartnersOfferPrivate({
          _id: jobId,
          partner_label: "Taleez",
          partner_job_id: "taleez_job_123",
          apply_email: null,
          offer_status: JOB_STATUS_ENGLISH.ACTIVE,
          offer_status_history: [],
          offer_expiration: offerExpiration,
        })
      )
      const application = generateApplicationFixture({
        applicant_id: applicant._id,
        job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
        job_id: jobId,
        to_company_message_id: null,
        to_applicant_message_id: null,
        scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
      })
      await getDbCollection("applications").insertOne(application)
      return { jobId, applicationId: application._id }
    }

    const mockTaleezResponseStatus = async (status: number) => {
      const axios = await import("axios")
      const response = { status, statusText: "", data: {}, headers: {}, config: {} } as AxiosResponse
      vi.mocked(axios.default.post).mockRejectedValueOnce(new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_RESPONSE", undefined, undefined, response))
    }

    beforeEach(() => {
      vi.mocked(syncJobPartnersToSearchItemsInBackground).mockClear()
      vi.mocked(sentryCaptureException).mockClear()
    })

    it("should cancel the offer and keep its expiration date when Taleez answers 410", async () => {
      const { jobId, applicationId } = await setupTaleezApplication()
      await mockTaleezResponseStatus(410)

      await processApplications()

      const job = await getDbCollection("jobs_partners").findOne({ _id: jobId })
      expect(job?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
      expect(job?.offer_expiration).toEqual(offerExpiration)
      expect(job?.offer_status_history).toEqual([
        { date: expect.any(Date), status: JOB_STATUS_ENGLISH.ANNULEE, reason: PARTNER_CLOSED_JOB_REASON, granted_by: "send-application-to-taleez" },
      ])
      expect(syncJobPartnersToSearchItemsInBackground).toHaveBeenCalledWith([jobId])
      expect(sentryCaptureException).toHaveBeenCalledOnce()
      expect(vi.mocked(sentryCaptureException).mock.calls[0][0]).toBeInstanceOf(PartnerJobClosedError)

      const application = await getDbCollection("applications").findOne({ _id: applicationId })
      expect(application?.scan_status).toBe(ApplicationScanStatus.UNKNOWN_ERROR)
      expect(application?.to_company_message_id).toBeNull()
      expect(mailerSendEmailSpy).not.toHaveBeenCalled()
    })

    it("should keep the offer active when Taleez answers another error", async () => {
      const { jobId, applicationId } = await setupTaleezApplication()
      await mockTaleezResponseStatus(500)

      await processApplications()

      const job = await getDbCollection("jobs_partners").findOne({ _id: jobId })
      expect(job?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
      expect(job?.offer_status_history).toEqual([])
      expect(syncJobPartnersToSearchItemsInBackground).not.toHaveBeenCalled()
      expect(sentryCaptureException).toHaveBeenCalledOnce()
      expect(vi.mocked(sentryCaptureException).mock.calls[0][0]).toBeInstanceOf(AxiosError)

      const application = await getDbCollection("applications").findOne({ _id: applicationId })
      expect(application?.scan_status).toBe(ApplicationScanStatus.UNKNOWN_ERROR)
    })
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
    expect(updatedApplication?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
  })

  // #5495 : le CV est conservé 1 an et purgé par un cron dédié, sauf s'il est infecté.
  describe("conservation du CV", () => {
    const s3DeleteSpy = vi.mocked(s3Delete)
    const isInfectedSpy = vi.mocked(isInfected)

    const setupApplication = async () => {
      const jobId = new ObjectId()
      const applicant = generateApplicantFixture({ email: `candidat-${new ObjectId()}@test.fr` })
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
        applicant_attachment_deleted_at: null,
      })
      await getDbCollection("applications").insertOne(application)
      return application
    }

    beforeEach(() => {
      s3DeleteSpy.mockClear()
      s3DeleteSpy.mockResolvedValue(undefined)
      isInfectedSpy.mockResolvedValue(false)
    })

    it("conserve le CV d'une candidature saine", async () => {
      const application = await setupApplication()

      await processApplications()

      expect(s3DeleteSpy).not.toHaveBeenCalled()
      const updated = await getDbCollection("applications").findOne({ _id: application._id })
      expect(updated?.scan_status).toBe(ApplicationScanStatus.NO_VIRUS_DETECTED)
      expect(updated?.applicant_attachment_deleted_at).toBeNull()
    })

    it("supprime immédiatement le CV d'une candidature infectée", async () => {
      isInfectedSpy.mockResolvedValue(true)
      const application = await setupApplication()

      await processApplications()

      expect(s3DeleteSpy).toHaveBeenCalledWith("applications", `cv-${application._id}`)
      const updated = await getDbCollection("applications").findOne({ _id: application._id })
      expect(updated?.scan_status).toBe(ApplicationScanStatus.VIRUS_DETECTED)
      expect(updated?.applicant_attachment_deleted_at).toBeInstanceOf(Date)
      // Le candidat est toujours prévenu de l'échec d'envoi.
      expect(mailerSendEmailSpy).toHaveBeenCalledTimes(1)
    })

    it("laisse scan_status à VIRUS_DETECTED quand la suppression S3 échoue", async () => {
      isInfectedSpy.mockResolvedValue(true)
      s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))
      const application = await setupApplication()

      await processApplications()

      const updated = await getDbCollection("applications").findOne({ _id: application._id })
      // Surtout pas ERROR_CLAMAV : la candidature repasserait au scan et un second mail d'échec
      // partirait vers le candidat.
      expect(updated?.scan_status).toBe(ApplicationScanStatus.VIRUS_DETECTED)
      // Date non posée : la passe "virus" du cron de purge rattrapera.
      expect(updated?.applicant_attachment_deleted_at).toBeNull()
    })
  })
})
