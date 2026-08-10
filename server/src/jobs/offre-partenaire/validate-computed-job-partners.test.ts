import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { generateComputedJobsPartnersFull } from "shared/fixtures/job-partners.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("fill-computed-jobs-partners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })

  it("should validate a valid offer", async () => {
    // given
    await givenSomeComputedJobPartners([generateComputedJobsPartnersFull()])
    // when
    await validateComputedJobPartners({})
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.validated).toEqual(true)
  })
  it("should invalidate an offer without rome", async () => {
    // given
    await givenSomeComputedJobPartners([
      generateComputedJobsPartnersFull({
        offer_rome_codes: [],
      }),
    ])
    // when
    await validateComputedJobPartners({})
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.validated).toEqual(false)
  })
})
