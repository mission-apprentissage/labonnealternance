import pick from "lodash-es/pick"
import nock from "nock"
import { generateCacheInfoSiretForSiret } from "shared/fixtures/cacheInfoSiret.fixture"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { entriesToTypedRecord } from "shared/utils/index"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"

const now = new Date("2024-07-21T04:49:06.000+02:00")
const filledFields = [
  "workplace_size",
  "workplace_name",
  "workplace_address_label",
  "workplace_address_street_label",
  "workplace_address_city",
  "workplace_address_zipcode",
  "workplace_geopoint",
  "workplace_naf_code",
  "workplace_naf_label",
  "workplace_brand",
  "workplace_legal_name",
] as const
const emptyFilledObject = entriesToTypedRecord(filledFields.map((key) => [key, null]))

describe("fillSiretInfosForPartners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    nock("https://entreprise.api.gouv.fr").get(/.*/).reply(404)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("cache_siret").deleteMany({})
    }
  })

  it("should not enrich when siret is missing", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: null,
        ...emptyFilledObject,
      },
    ])
    // when
    await fillSiretInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.errors).toEqual([])
    expect.soft(job.workplace_name).toEqual(null)
  })
  it("should enrich with cache when siret is present", async () => {
    // given
    const siret = "42476141900010"
    await givenSomeComputedJobPartners([
      {
        workplace_siret: siret,
        ...emptyFilledObject,
      },
    ])
    await getDbCollection("cache_siret").insertOne(generateCacheInfoSiretForSiret(siret))
    // when
    await fillSiretInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.errors).toEqual([])
    expect.soft(pick(job, filledFields)).toMatchSnapshot()
  })
  it("should enrich with api when siret is present", async () => {
    // given
    const siret = "42476141900011"
    await givenSomeComputedJobPartners([
      {
        workplace_siret: siret,
        ...emptyFilledObject,
      },
    ])

    nock.cleanAll()
    nock("https://entreprise.api.gouv.fr/v3/insee").get(`/sirene/etablissements/diffusibles/${siret}`).query(true).reply(200, generateCacheInfoSiretForSiret(siret).data!)

    // when
    await fillSiretInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.errors).toEqual([])
    expect.soft(job.business_error).toEqual(null)
    expect.soft(pick(job, filledFields)).toMatchSnapshot()
  })
  it("should add an error in the document when data is not found", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: "42476141900012",
        ...emptyFilledObject,
      },
    ])
    // when
    await fillSiretInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.errors).toEqual([
      {
        error: "data not found",
        source: COMPUTED_ERROR_SOURCE.API_SIRET,
      },
    ])
  })

  it("should add business_error closed_company to document when company is closed", async () => {
    // given
    const siret = "73282932000074"
    await givenSomeComputedJobPartners([
      {
        workplace_siret: siret,
        ...emptyFilledObject,
      },
    ])

    nock.cleanAll()
    nock("https://entreprise.api.gouv.fr/v3/insee").get(`/sirene/etablissements/diffusibles/${siret}`).query(true).reply(200, generateCacheInfoSiretForSiret(siret, "F").data!)

    // when
    await fillSiretInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.errors).toEqual([])
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CLOSED_COMPANY)
  })

  it("should be able to handle multiple documents", async () => {
    // given
    const [initJob1, initJob2] = await givenSomeComputedJobPartners([
      {
        partner_job_id: "1",
        workplace_siret: "12345678900015",
        workplace_opco: null,
        workplace_idcc: null,
      },
      {
        partner_job_id: "2",
        workplace_siret: "12345678900023",
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    nock.cleanAll()
    nock("https://entreprise.api.gouv.fr/v3/insee")
      .get(`/sirene/etablissements/diffusibles/${initJob1.workplace_siret!}`)
      .query(true)
      .reply(200, generateCacheInfoSiretForSiret(initJob1.workplace_siret!).data!)
    nock("https://entreprise.api.gouv.fr/v3/insee")
      .get(`/sirene/etablissements/diffusibles/${initJob2.workplace_siret!}`)
      .query(true)
      .reply(200, generateCacheInfoSiretForSiret(initJob2.workplace_siret!).data!)
    // when
    await fillSiretInfosForPartners()
    // then
    const jobs = (await getDbCollection("computed_jobs_partners").find({}).toArray()).sort((a, b) => (a.partner_job_id! < b.partner_job_id! ? -1 : 1))
    expect.soft(jobs.length).toBe(2)
    const [job1, job2] = jobs
    expect.soft(job1.errors).toEqual([])
    expect.soft(job2.errors).toEqual([])
  })
})
