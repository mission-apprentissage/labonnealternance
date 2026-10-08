import { internal } from "@hapi/boom"
import { captureException } from "@sentry/node"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { generateHelloworkApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { describe, expect, it, vi } from "vitest"

import { s3WriteString } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"

vi.mock("@/common/utils/aws-utils", () => {
  return {
    s3WriteString: vi.fn().mockResolvedValue(undefined),
  }
})
vi.mock("@sentry/node", async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import("@sentry/node")>()),
    captureException: vi.fn(),
  }
})
vi.mock("@/services/clamav.service", () => {
  return {
    isInfected: vi.fn().mockResolvedValue(false),
  }
})

const partnerJob = generateJobsPartnersOfferPrivate({
  _id: new ObjectId("6081289803569600282e0020"),
  offer_status: JOB_STATUS_ENGLISH.ACTIVE,
  apply_email: "employer@test.fr",
})

useMongo(async () => {
  await getDbCollection("jobs_partners").insertOne(partnerJob)
})

describe("POST /application/hellowork", () => {
  const httpClient = useServer()

  it("return 500 without internal details and report the S3 error to Sentry when the CV cannot be written", async () => {
    const s3Error = internal("Error writing S3 file", { key: "cv-key", bucket: "applications-bucket" })
    vi.mocked(s3WriteString).mockRejectedValueOnce(s3Error)
    const body = generateHelloworkApplicationFixture({
      job: { jobId: partnerJob._id.toString(), jobAtsUrl: "https://ats.company.com/jobs/developer" },
    })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/application/hellowork",
      body,
      headers: { "x-api-key": config.helloworkApiKey },
    })

    expect.soft(response.statusCode).toEqual(500)
    expect.soft(response.json()).toEqual({ message: "Erreur interne du serveur", code: "InternalServerError" })
    expect.soft(await getDbCollection("applications").countDocuments()).toBe(0)
    // beforeSend écarte les Boom < 500 : l'erreur capturée doit être un 500 portant l'erreur S3 en cause
    expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ output: expect.objectContaining({ statusCode: 500 }), cause: s3Error }), expect.anything())
  })
})
