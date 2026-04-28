import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { blockJobsPartnersFromFluxCompanyList } from "./blockJobsPartnersFromFluxCompanyList"

describe("blockJobsPartnersFromFluxCompanyList", () => {
  useMongo()

  it('should block the offer when workplace_name is "L\'Oreal"', async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "L'Oreal",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromFluxCompanyList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.TRUSTED_COMPANY_JOB_DUPLICATE)
  })

  it('should block the offer when workplace_name is "Décathlon"', async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "Décathlon et associés",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromFluxCompanyList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.TRUSTED_COMPANY_JOB_DUPLICATE)
  })

  it('should block the offer when workplace_name is "Institut Pasteur"', async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "go Institut Pasteur",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromFluxCompanyList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.TRUSTED_COMPANY_JOB_DUPLICATE)
  })

  it("should block the offer when workplace_legal_name is in the flux company list", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        workplace_legal_name: "Institut Pasteur",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromFluxCompanyList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.TRUSTED_COMPANY_JOB_DUPLICATE)
  })

  it("should NOT block the offer when the company name is not in the flux list", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromFluxCompanyList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(null)
  })

  it("should NOT block a whitelisted partner even when the company name is in the flux list", async () => {
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.DECATHLON,
        workplace_name: "Décathlon",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromFluxCompanyList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(null)
  })
})
