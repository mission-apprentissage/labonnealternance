import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { blockJobsPartnersFromExpirationDate } from "./blockJobsPartnersFromExpirationDate"

const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24) // yesterday
const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24) // tomorrow

describe("blockJobsPartnersFromExpirationDate", () => {
  useMongo()

  it("should set business_error to EXPIRED and offer_status to ANNULEE when offer is expired", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_expiration: pastDate,
        business_error: null,
      },
    ])

    await blockJobsPartnersFromExpirationDate({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.EXPIRED)
    expect.soft(job.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
  })

  it("should NOT change business_error or offer_status when offer is not expired", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_expiration: futureDate,
        business_error: null,
      },
    ])

    await blockJobsPartnersFromExpirationDate({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toBeNull()
    expect.soft(job.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("should NOT process an offer with no expiration date", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_expiration: null,
        business_error: null,
      },
    ])

    await blockJobsPartnersFromExpirationDate({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toBeNull()
    expect.soft(job.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("should preserve existing business_error when offer is expired", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_expiration: pastDate,
        business_error: JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED,
        offer_status: null,
      },
    ])

    await blockJobsPartnersFromExpirationDate({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    // The factory filter requires business_error: null, so this document is skipped
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })
})
