import fs from "node:fs/promises"
import type Stream from "stream"

import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { generateJobsPartnersFull } from "shared/src/fixtures/jobPartners.fixture"
import { EXPORT_JOBS_TO_S3_V2_FILENAME, exportJobsToS3V2 } from "./exportJobsToS3V2"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { streamToString } from "@/common/utils/streamUtils"
import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"

useMongo()

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
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs.length).toBe(2)
    expect.soft(jobs).toMatchSnapshot()
  })
  it("should publish a partenariat job", async () => {
    // given
    await createJobPartner(
      generateJobsPartnersFull({
        _id: new ObjectId("66c52e00c8f12f66f971106f"),
        partner_job_id: "id_1",
        is_delegated: true,
        cfa_siret: "12345678901234",
        cfa_address_label: "rue du cfa 75002 Paris",
        cfa_apply_email: "cfa@cfa.fr",
        cfa_apply_phone: "0123456789",
        cfa_legal_name: "nom CFA",
      })
    )
    // when
    const jobs = await exportJobsToS3V2ForTests()
    // then
    expect.soft(jobs.length).toBe(1)
    expect.soft(jobs).toMatchSnapshot()
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
})
