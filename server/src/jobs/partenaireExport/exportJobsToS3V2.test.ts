import fs from "node:fs/promises"
import Stream from "stream"

import { ObjectId } from "mongodb"
import { IJob, IRecruiter, JOB_STATUS, JOB_STATUS_ENGLISH } from "shared"
import { OPCOS_LABEL, RECRUITER_STATUS } from "shared/constants/recruteur"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { streamToString } from "@/common/utils/streamUtils"
import { EXPORT_JOBS_TO_S3_V2_FILENAME, exportJobsToS3V2 } from "@/jobs/partenaireExport/exportJobsToS3V2"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { generateJobsPartnersFull } from "../../../../shared/src/fixtures/jobPartners.fixture"

useMongo()

const generateValidRecruiter = (props: Partial<IRecruiter> = {}): IRecruiter => {
  return generateRecruiterFixture({
    idcc: 1000,
    opco: OPCOS_LABEL.ATLAS,
    status: RECRUITER_STATUS.ACTIF,
    address: "3 rue du loup 75001 Paris",
    geopoint: {
      type: "Point",
      coordinates: [0, 0],
    },
    jobs: [generateValidJob()],
    ...props,
  })
}

const generateValidJob = (props: Partial<IJob> = {}): IJob => {
  return generateJobFixture({
    job_status: JOB_STATUS.ACTIVE,
    ...props,
  })
}

const exportJobsToS3V2ForTests = async () => {
  let content = ""
  const handleStream = async (filepath: string, stream: Stream.Readable) => {
    content = await streamToString(stream)
  }
  await exportJobsToS3V2(handleStream)
  return JSON.parse(content)
}

describe("exportJobsToS3V2", () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-08-21"))

    return async () => {
      vi.useRealTimers()
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("recruiters").deleteMany({})
      const filepath = new URL(`./${EXPORT_JOBS_TO_S3_V2_FILENAME}`, import.meta.url).pathname
      try {
        await fs.unlink(filepath)
      } catch (err) {
        console.warn(`could not delete ${filepath}`)
      }
    }
  })

  it("should publish jobs", async () => {
    // given
    await createJobPartner(generateJobsPartnersFull({ _id: new ObjectId("66c52e00c8f12f66f971106f"), partner_job_id: "id_1" }))
    await createJobPartner(generateJobsPartnersFull({ _id: new ObjectId("66c52e00393b331450d8bedc"), partner_job_id: "id_2" }))
    await getDbCollection("recruiters").insertMany([
      generateValidRecruiter({
        _id: new ObjectId("66c52e00799958c69908c660"),
        jobs: [
          generateValidJob({
            _id: new ObjectId("66c52e0088651f3c2cd0d785"),
            rome_appellation_label: "Boulanger",
          }),
          generateValidJob({
            _id: new ObjectId("66c52e00f03faa7ce1aaccbc"),
            rome_appellation_label: "Patissier",
          }),
        ],
      }),
    ])
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs).toMatchSnapshot()
    expect.soft(jobs.length).toBe(4)
  })
  it("should not publish a job partner that is not active", async () => {
    // given
    await createJobPartner(generateJobsPartnersFull({ offer_status: JOB_STATUS_ENGLISH.ANNULEE }))
    await createJobPartner(generateJobsPartnersFull({ offer_status: JOB_STATUS_ENGLISH.POURVUE }))
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs.length).toBe(0)
  })
  it("should not publish a recruiter that is not active", async () => {
    // given
    await getDbCollection("recruiters").insertMany([
      generateValidRecruiter({
        status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION,
      }),
      generateValidRecruiter({
        status: RECRUITER_STATUS.ARCHIVE,
      }),
    ])
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs.length).toBe(0)
  })
  it("should not publish a recruiter that is does not have a valid geopoint", async () => {
    // given
    await getDbCollection("recruiters").insertMany([
      generateValidRecruiter({
        geopoint: null,
      }),
    ])
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs.length).toBe(0)
  })
  it("should not publish a inative jobs", async () => {
    // given
    await getDbCollection("recruiters").insertMany([
      generateValidRecruiter({
        jobs: [
          generateValidJob(),
          generateValidJob({
            job_status: JOB_STATUS.ANNULEE,
          }),
          generateValidJob({
            job_status: JOB_STATUS.POURVUE,
          }),
          generateValidJob({
            job_status: JOB_STATUS.EN_ATTENTE,
          }),
        ],
      }),
    ])
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs.length).toBe(0)
  })
})
