import { badRequest } from "@hapi/boom"
import { ObjectId } from "bson"
import dayjs from "shared/helpers/dayjs"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { RECRUITER_STATUS } from "shared/constants/index"
import { applicationTestFile, generateHelloworkApplicationFixture } from "shared/fixtures/application.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import type { IReferentielRome } from "shared/models/index"
import { JOB_STATUS, JOB_STATUS_ENGLISH } from "shared/models/index"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { buildApplicationFromHelloworkAndSaveToDb, sendApplicationV2 } from "./application.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveRecruiter } from "@tests/utils/user.test.utils"

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
    const dateMoins1 = dayjs().add(-1, "day")

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

    await saveRecruiter(
      generateRecruiterFixture({
        status: RECRUITER_STATUS.ACTIF,
        jobs: [
          {
            _id: new ObjectId("6081289803569600282e0001"),
            rome_code: ["A1101"],
            job_expiration_date: dateMoins1.toDate(),
          },
        ],
      })
    )

    const datePlus1 = dayjs().add(1, "day")

    await saveRecruiter(
      generateRecruiterFixture({
        status: RECRUITER_STATUS.ARCHIVE,
        jobs: [
          {
            _id: new ObjectId("6081289803569600282e0002"),
            rome_code: ["A1101"],
            job_expiration_date: datePlus1.toDate(),
          },
        ],
      })
    )

    await saveRecruiter(
      generateRecruiterFixture({
        status: RECRUITER_STATUS.ACTIF,
        jobs: [
          {
            _id: new ObjectId("6081289803569600282e0003"),
            rome_code: ["A1101"],
            job_status: JOB_STATUS.POURVUE,
            job_expiration_date: datePlus1.toDate(),
          },
        ],
      })
    )

    return async () => {
      await getDbCollection("recruiters").deleteMany({})
      await getDbCollection("referentielromes").deleteMany({})
    }
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
  })

  it("Should refuse sending application to expired job because of expiry date", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "recruiters", jobId: "6081289803569600282e0001" },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to expired job because of recruiter status", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "recruiters", jobId: "6081289803569600282e0002" },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to expired job because of job status", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "recruiters", jobId: "6081289803569600282e0003" },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.EXPIRED))
  })

  it("Should refuse sending application to non existent company", async () => {
    await expect(
      sendApplicationV2({
        newApplication: {
          ...fakeApplication,
          recipient_id: { collectionName: "partners", jobId: "6081289803569600282e0003" },
        },
      })
    ).rejects.toThrow(badRequest(BusinessErrorCodes.NOTFOUND))
  })
})

describe("buildApplicationFromHelloworkAndSaveToDb", () => {
  beforeEach(async () => {
    // Clean up collections before each test
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("applicants").deleteMany({})
    await getDbCollection("applications").deleteMany({})
  })

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
        email: "john.doe@example.com",
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
        email: "jane.smith@example.com",
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

  it("Should default to application/pdf when contentType is empty", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0012"),
      partner_job_id: "job_dev_003",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0012",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      resume: {
        file: {
          fileName: "CV_Test.pdf",
          contentType: "  ",
          data: "JVBERi0xLjQKJeLjz9MK",
        },
      },
    })

    const result = await buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)

    expect(result).toHaveProperty("atsApplicationId")

    // The application should be created successfully with default contentType
    const savedApplication = await getDbCollection("applications").findOne({ _id: new ObjectId(result.atsApplicationId) })
    expect(savedApplication).toBeTruthy()
    expect(savedApplication?.applicant_file_content).toContain("data:application/pdf;base64")
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
      offer_status: JOB_STATUS_ENGLISH.INACTIVE,
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

  it("Should properly handle non-standard contentType", async () => {
    const partnerJob = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("6081289803569600282e0014"),
      partner_job_id: "job_dev_005",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      apply_email: "employer@test.fr",
    })
    await getDbCollection("jobs_partners").insertOne(partnerJob)

    const helloworkPayload = generateHelloworkApplicationFixture({
      job: {
        jobId: "6081289803569600282e0014",
        jobAtsUrl: "https://ats.company.com/jobs/developer",
      },
      resume: {
        file: {
          fileName: "CV_Test.docx",
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          data: "UEsDBBQABgAIAAAAIQ",
        },
      },
    })

    const result = await buildApplicationFromHelloworkAndSaveToDb(helloworkPayload)

    expect(result).toHaveProperty("atsApplicationId")

    const savedApplication = await getDbCollection("applications").findOne({ _id: new ObjectId(result.atsApplicationId) })
    expect(savedApplication).toBeTruthy()
    expect(savedApplication?.applicant_file_content).toContain("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64")
  })
})
