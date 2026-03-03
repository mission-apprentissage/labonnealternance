import nock from "nock"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it } from "vitest"

import { blockJobsPartnersFromCfaList } from "./blockJobsPartnersFromCfaList"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

describe("blockJobsPartnersFromCfaListTask", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })

  it("should block the offer", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "ISCOD",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { business_error } = job
    expect.soft(business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })
  it("should NOT block the offer", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { business_error } = job
    expect.soft(business_error).toEqual(null)
  })
})
