import { badRequest } from "@hapi/boom"
import { ObjectId } from "bson"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { applicationTestFile, generateApplicationFixture, generateHelloworkApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import dayjs from "shared/helpers/dayjs"
import type { IReferentielRome } from "shared/models/index"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { omit } from "lodash-es"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { buildApplicationFromHelloworkAndSaveToDb, sendApplicationV2 } from "./application.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"

// Mock S3 operations to avoid actual AWS calls during tests
vi.mock("@/common/utils/awsUtils", () => {
  return {
    s3WriteString: vi.fn().mockResolvedValue(undefined),
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

  it("Should throw error when too many applications per SIRET from caller", async () => {
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
