import { badRequest } from "@hapi/boom"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { omit } from "lodash-es"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { RECRUITER_STATUS } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { applicationTestFile, generateApplicantFixture, generateApplicationFixture, generateHelloworkApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import dayjs from "shared/helpers/dayjs"
import type { IReferentielRome } from "shared/models/index"
import { ApplicationScanStatus, JOB_STATUS, JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import mailer from "@/services/mailer.service"
import { buildApplicationFromHelloworkAndSaveToDb, processApplicationEmails, sendApplicationV2 } from "./application.service"

// Mock S3 operations to avoid actual AWS calls during tests
vi.mock("@/common/utils/awsUtils", () => {
  return {
    s3WriteString: vi.fn().mockResolvedValue(undefined),
    s3ReadAsString: vi.fn().mockResolvedValue(applicationTestFile),
    s3Delete: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock ClamAV antivirus service to avoid dependency on external service
vi.mock("@/services/clamav.service", () => {
  return {
    isInfected: vi.fn().mockResolvedValue(false),
  }
})

// Mock mailer service to avoid sending actual emails during tests
vi.mock("@/services/mailer.service", () => {
  return {
    default: {
      sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }),
      renderEmail: vi.fn().mockResolvedValue("<html>Test Email</html>"),
    },
  }
})

// Mock axios to avoid actual HTTP calls during tests (used by Taleez API integration)
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

const fakeApplication = {
  applicant_first_name: "a",
  applicant_last_name: "a",
  applicant_email: "test@test.fr",
  applicant_phone: "0125252525",
  applicant_message: "applicant message",
  applicant_attachment_name: "cv.pdf",
  applicant_attachment_content: applicationTestFile,
}

describe("Sending application", () => {
  beforeEach(async () => {
    const romes: IReferentielRome[] = [
      generateReferentielRome({
        rome: {
          code_rome: "A1101",
          intitule: "Opérations administratives",
          code_ogr: "475",
        },
      }),
    ]
    await getDbCollection("referentielromes").insertMany(romes)

    return async () => {
      await getDbCollection("referentielromes").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("applicants").deleteMany({})
      await getDbCollection("applications").deleteMany({})
    }
  })
  it("Should send an application to a job", async () => {
    const job = await createJobPartner({
      apply_email: "email@gmail.com",
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_rome_codes: ["A1101"],
      offer_expiration: dayjs().add(1, "day").toDate(),
    })
    const result = await sendApplicationV2({
      newApplication: {
        ...fakeApplication,
        recipient_id: { collectionName: "partners", jobId: job._id.toString() },
      },
    })
    expect.soft(omit(result, ["_id"])).toMatchSnapshot()
  })
  it("Should refuse sending application to non existent job", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "recruiters", jobId: "6081289803569600282e0000" },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.NOTFOUND))
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "partners", jobId: "6081289803569600282e0003" },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.NOTFOUND))
  })
  it("Should accept application for a Taleez partner job with null apply_email without throwing INTERNAL_EMAIL", async () => {
    const taleezJobId = new ObjectId("6081289803569600282e0005")
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        _id: taleezJobId,
        partner_label: "Taleez",
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        apply_email: null,
      })
    )

    const result = await sendApplicationV2({
      newApplication: {
        ...fakeApplication,
        recipient_id: { collectionName: "partners", jobId: taleezJobId.toString() },
      },
    })

    expect(result).toHaveProperty("_id")
  })
  it("Should throw INTERNAL_EMAIL for a non-Taleez partner job with null apply_email", async () => {
    const partnerJobId = new ObjectId("6081289803569600282e0006")
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        _id: partnerJobId,
        partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        apply_email: null,
      })
    )

    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "partners", jobId: partnerJobId.toString() },
        },
      })
    ).rejects.toThrow(BusinessErrorCodes.INTERNAL_EMAIL)
  })
  it("Should refuse sending application to expired job because of expiry date", async () => {
    const expiredJob = await createJobPartner({
      apply_email: "email@gmail.com",
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_rome_codes: ["A1101"],
      offer_expiration: dayjs().add(-1, "day").toDate(),
    })
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "partners", jobId: expiredJob._id.toString() },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to cancelled job", async () => {
    const canceledJob = await createJobPartner({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      offer_rome_codes: ["A1101"],
      offer_expiration: dayjs().add(1, "day").toDate(),
    })
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "partners", jobId: canceledJob._id.toString() },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to provided job", async () => {
    const providedJob = await createJobPartner({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.POURVUE,
      offer_rome_codes: ["A1101"],
      offer_expiration: dayjs().add(1, "day").toDate(),
    })
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "partners", jobId: providedJob._id.toString() },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })
})

describe("buildApplicationFromHelloworkAndSaveToDb", () => {
  afterEach(async () => {
    // Clean up collections after each test
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("applicants").deleteMany({})
    await getDbCollection("applications").deleteMany({})
  })

  it("Should successfully create application from Hellowork with valid data", async () => {
    // Create a valid partner job
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0010"),
      partner_job_id: "job_dev_001",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      applicationId: "hw_app_123",
      job: {
        jobId: "6081289803569600282e0010",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      applicant: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@orange.fr",
        phoneNumber: "+33612345678",
        coverLetter: "I am very interested in this position",
      },
      resume: {
        file: {
          fileName: "CV_John_Doe.pdf",
          contentType: "application/pdf",
          data: "JVBERi0xLjQKJeLjz9MK",
        },
      },
      statusApiUrl: "https://api.hellowork.com/status/hw_app_123",
    })

    const result = await buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)

    expect(result).toHaveProperty("atsApplicationId")
    expect(result.atsApplicationId).toBeTruthy()
    expect(typeof result.atsApplicationId).toBe("string")

    // Verify the application was created in the database
    const savedApplication = await getDbCollection("applications").findOne({ _id: new ObjectId(result.atsApplicationId) })
    expect(savedApplication).toBeTruthy()
    expect(savedApplication?.caller).toBe("Hellowork")
    expect(savedApplication?.foreign_application_id).toBe("hw_app_123")
    expect(savedApplication?.foreign_application_status_url).toBe("https://api.hellowork.com/status/hw_app_123")
    expect(omit(savedApplication, ["_id", "applicant_id", "created_at", "last_update_at"])).toMatchSnapshot()
  })

  it("Should successfully create application with missing coverLetter", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0011"),
      partner_job_id: "job_dev_002",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0011",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      applicant: {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@orange.fr",
        phoneNumber: "+33698765432",
        coverLetter: undefined,
      },
    })

    const result = await buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)

    expect(result).toHaveProperty("atsApplicationId")
    expect(result.atsApplicationId).toBeTruthy()

    // Verify the application message is empty when no cover letter
    const savedApplication = await getDbCollection("applications").findOne({ _id: new ObjectId(result.atsApplicationId) })
    expect(savedApplication?.applicant_message_to_company).toBe("")
  })

  it("Should throw error when partner job does not exist", async () => {
    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e9999",
        jobAtsUrl: "https://ats.company.com/jobs/nonexistent",
      },
    })

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(badRequest(BusinessErrorCodes.NOTFOUND))
  })

  it("Should throw error when partner job is expired", async () => {
    const expiredJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0013"),
      partner_job_id: "job_dev_004",
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(expiredJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0013",
        jobAtsUrl: "https://ats.company.com/jobs/expired",
      },
    })

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should throw error when applicant uses burner email", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0015"),
      partner_job_id: "job_dev_006",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0015",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      applicant: {
        firstName: "Test",
        lastName: "User",
        email: "test@yopmail.com", // yopmail is a known burner email domain
        phoneNumber: "+33612345678",
      },
    })

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(badRequest(BusinessErrorCodes.BURNER))
  })

  it("Should throw error when file type is not supported", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0016"),
      partner_job_id: "job_dev_007",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@orange.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0016",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      resume: {
        file: {
          fileName: "CV_Test.txt",
          contentType: "text/plain",
          data: "VGhpcyBpcyBhIHRleHQgZmlsZQ==", // Base64 for "This is a text file"
        },
      },
    })

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(badRequest(BusinessErrorCodes.FILE_TYPE_NOT_SUPPORTED))
  })

  it("Should throw error when too many applications per offer", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0017"),
      partner_job_id: "job_dev_008",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
      workplace_siret: "12345678901234",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0017",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      applicant: {
        firstName: "Repeat",
        lastName: "Applicant",
        email: "repeat.applicant@orange.com",
        phoneNumber: "+33612345678",
      },
    })

    // Create applicant
    const applicant = await getDbCollection("applicants").insertOne({
      _id: new ObjectId(),
      firstname: "Repeat",
      lastname: "Applicant",
      email: "repeat.applicant@orange.com",
      phone: "0612345678",
      last_connection: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create 3 existing applications for the same job and applicant
    // This is at the limit, so the next (4th) application should trigger the error (max is 3)
    const applications = Array.from({ length: 3 }, () =>
      generateApplicationFixture({
        applicant_id: applicant.insertedId,
        job_id: new ObjectId("6081289803569600282e0017"),
        company_siret: "12345678901234",
        applicant_message_to_company: "Test application",
        created_at: new Date(),
        last_update_at: new Date(),
      })
    )
    await getDbCollection("applications").insertMany(applications)

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_OFFER)
  })

  it("Should throw error when too many applications per day", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0018"),
      partner_job_id: "job_dev_009",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0018",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      applicant: {
        firstName: "Spam",
        lastName: "Applicant",
        email: "spam.applicant@orange.com",
        phoneNumber: "+33612345678",
      },
    })

    // Create applicant
    const applicant = await getDbCollection("applicants").insertOne({
      _id: new ObjectId(),
      firstname: "Spam",
      lastname: "Applicant",
      email: "spam.applicant@orange.com",
      phone: "0612345678",
      last_connection: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create 101 applications for today (max is 100)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const applications = Array.from({ length: 101 }, () =>
      generateApplicationFixture({
        applicant_id: applicant.insertedId,
        job_id: new ObjectId(),
        company_siret: null,
        applicant_message_to_company: "Test application",
        created_at: new Date(),
        last_update_at: new Date(),
      })
    )
    await getDbCollection("applications").insertMany(applications)

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_DAY)
  })

  it("Should throw error when too many applications per SIRET from caller (Hellowork)", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0019"),
      partner_job_id: "job_dev_010",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
      workplace_siret: "98765432109876",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0019",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      applicant: {
        firstName: "Caller",
        lastName: "Applicant",
        email: "caller.applicant@orange.com",
        phoneNumber: "0612345678",
      },
    })

    // Create 20 applications from Hellowork caller to the same SIRET today (max is 20)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const applications = Array.from({ length: 20 }, () =>
      generateApplicationFixture({
        applicant_id: new ObjectId(),
        job_id: new ObjectId(),
        company_siret: "98765432109876",
        caller: "Hellowork",
        applicant_message_to_company: "Test application",
        created_at: new Date(),
        last_update_at: new Date(),
      })
    )
    await getDbCollection("applications").insertMany(applications)

    await expect(buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)).rejects.toThrow(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_SIRET)
  })
})

describe("checkMaxApplicationCount", () => {
  afterEach(async () => {
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("applications").deleteMany({})
    await getDbCollection("applicants").deleteMany({})
    await getDbCollection("referentielromes").deleteMany({})
  })

  it("Should not update offer status when application count is at the limit (RECRUTEURS_LBA)", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0030"),
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
      workplace_siret: "12345678901234",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    // 79 existing + current submission = 80 total, condition (79+1) > 80 is false
    const applications = Array.from({ length: 79 }, () => generateApplicationFixture({ company_siret: "12345678901234" }))
    await getDbCollection("applications").insertMany(applications)

    await sendApplicationV2({
      newApplication: {
        ...fakeApplication,
        recipient_id: { collectionName: "partners", jobId: "6081289803569600282e0030" },
      },
    })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId("6081289803569600282e0030") })
    expect(updatedJob?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("Should NOT update offer status to ANNULEE when application count exceeds limit (RECRUTEURS_LBA)", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0031"),
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
      workplace_siret: "98765432109876",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    // 80 existing + current submission = 81 total, condition (80+1) > 80 is true
    const applications = Array.from({ length: 80 }, () =>
      generateApplicationFixture({ job_id: new ObjectId("6081289803569600282e0031"), company_siret: "98765432109876", created_at: new Date() })
    )
    await getDbCollection("applications").insertMany(applications)

    await sendApplicationV2({
      newApplication: {
        ...fakeApplication,
        recipient_id: { collectionName: "partners", jobId: "6081289803569600282e0031" },
      },
    })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId("6081289803569600282e0031") })
    expect(updatedJob?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("Should update offer status to ANNULEE when application count exceeds limit (OFFRES_EMPLOI_LBA)", async () => {
    const jobId = new ObjectId("6081289803569600282e0033")

    await getDbCollection("referentielromes").insertOne(generateReferentielRome({ rome: { code_rome: "A1101", intitule: "Opérations administratives", code_ogr: "475" } }))
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        _id: jobId,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        apply_email: "employer@test.fr",
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      })
    )

    // 80 existing + current submission = 81 total, condition (80+1) > 80 is true
    const applications = Array.from({ length: 80 }, () => generateApplicationFixture({ job_id: jobId, created_at: new Date() }))
    await getDbCollection("applications").insertMany(applications)

    await sendApplicationV2({
      newApplication: {
        ...fakeApplication,
        recipient_id: { collectionName: "recruiters", jobId: jobId.toString() },
      },
    })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobId })
    expect(updatedJob?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
  })
})

describe("processApplicationEmails.sendEmailsIfNeeded", () => {
  const mailerSendEmailSpy = vi.mocked(mailer.sendEmail)

  beforeEach(async () => {
    mailerSendEmailSpy.mockClear()
  })

  it("should send applicant and company messages for recruteur_lba", async () => {
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
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
    })
    await getDbCollection("applications").insertOne(application)

    await processApplicationEmails.sendEmailsIfNeeded(application, applicant)

    // Should send both company email (mail-candidature-spontanee) and applicant email (mail-candidat-recruteur-lba)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
    const templates = mailerSendEmailSpy.mock.calls.map((call) => call[0].template)
    expect(templates).toEqual(expect.arrayContaining([expect.stringContaining("mail-candidature-spontanee")]))
    expect(templates).toEqual(expect.arrayContaining([expect.stringContaining("mail-candidat-recruteur-lba")]))

    // DB should be updated with both message IDs
    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
  })

  it("should send applicant and company messages for offres_emploi_lba", async () => {
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
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
    })
    await getDbCollection("applications").insertOne(application)

    await processApplicationEmails.sendEmailsIfNeeded(application, applicant)

    // Should send both company email (mail-candidature) and applicant email (mail-candidat-offre-emploi)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
    const templates = mailerSendEmailSpy.mock.calls.map((call) => call[0].template)
    expect(templates).toEqual(expect.arrayContaining([expect.stringContaining("mail-candidature")]))
    expect(templates).toEqual(expect.arrayContaining([expect.stringContaining("mail-candidat-offre-emploi")]))

    // DB should be updated with both message IDs
    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
  })

  it("should send applicant message and call Taleez API for Taleez partner_label", async () => {
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
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
    })
    await getDbCollection("applications").insertOne(application)

    // Import axios to check the mock call
    const axios = await import("axios")
    vi.mocked(axios.default.post).mockClear()

    await processApplicationEmails.sendEmailsIfNeeded(application, applicant)

    // Should call Taleez API (not send company email)
    expect(vi.mocked(axios.default.post)).toHaveBeenCalledOnce()

    // Should send only applicant email (not company email)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(1)
    expect(mailerSendEmailSpy.mock.calls[0][0]).toMatchObject({ to: applicant.email })

    // DB: to_company_message_id should remain null (Taleez handles it), to_applicant_message_id should be set
    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updatedApplication?.to_company_message_id).toEqual("Taleez")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
  })

  it("should send applicant and company messages for other partner_label", async () => {
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
      scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
    })
    await getDbCollection("applications").insertOne(application)

    await processApplicationEmails.sendEmailsIfNeeded(application, applicant)

    // Should send both company email (mail-candidature-partenaire) and applicant email (mail-candidat-offre-emploi)
    expect(mailerSendEmailSpy).toHaveBeenCalledTimes(2)
    const templates = mailerSendEmailSpy.mock.calls.map((call) => call[0].template)
    expect(templates).toEqual(expect.arrayContaining([expect.stringContaining("mail-candidature-partenaire")]))
    expect(templates).toEqual(expect.arrayContaining([expect.stringContaining("mail-candidat-offre-emploi")]))

    // DB should be updated with both message IDs
    const updatedApplication = await getDbCollection("applications").findOne({ _id: application._id })
    expect(updatedApplication?.to_company_message_id).toBe("test-message-id")
    expect(updatedApplication?.to_applicant_message_id).toBe("test-message-id")
  })
})
