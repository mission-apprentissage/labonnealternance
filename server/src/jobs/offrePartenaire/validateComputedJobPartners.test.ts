import nock from "nock"
import { generateJobsPartnersFull } from "shared/fixtures/jobPartners.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { validateComputedJobPartners } from "@/jobs/offrePartenaire/validateComputedJobPartners"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("fillComputedJobsPartners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })

  it("should validate a valid offer", async () => {
    // given
    await givenSomeComputedJobPartners([generateJobsPartnersFull()])
    // when
    await validateComputedJobPartners({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.validated).toEqual(true)
  })
  it("should invalidate an offer without rome", async () => {
    // given
    await givenSomeComputedJobPartners([
      generateJobsPartnersFull({
        offer_rome_codes: [],
      }),
    ])
    // when
    await validateComputedJobPartners({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.validated).toEqual(false)
  })
})
