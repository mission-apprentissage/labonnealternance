import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { GEIQ_WHITELIST } from "./geiqWhitelist"
import { blockJobsPartnersFromCfaList } from "./blockJobsPartnersFromCfaList"

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

  it("should block the offer when the CFA is mentioned in offer_description", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        offer_description: "Formation en alternance avec Iscod pour une prise de poste immediate",
        business_error: null,
      },
    ])

    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })

  it("should block the offer when the CFA is mentioned in workplace_description", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        workplace_description: "Entreprise partenaire du CFA Iscod pour le recrutement en alternance",
        business_error: null,
      },
    ])

    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })

  it("should NOT block the offer", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        offer_description: "Description d'offre legitime",
        workplace_description: "Description d'entreprise legitime",
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

  it("should NOT block a whitelisted partner even when the company name is blacklisted", async () => {
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.JOBTEASER,
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
    expect.soft(business_error).toEqual(null)
  })

  it("should NOT block an offer from the GEIQ whitelist even when workplace_name is in the CFA blacklist", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_siret: GEIQ_WHITELIST[0],
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
    expect.soft(job.business_error).toEqual(null)
  })
})
