import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import pick from "lodash-es/pick"
import { ObjectId } from "mongodb"
import nock from "nock"
import { OPCOS_LABEL } from "shared/constants"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"

const now = new Date("2024-07-21T04:49:06.000+02:00")
const filledFields = ["workplace_opco", "workplace_idcc"]

describe("fillOpcoInfosForPartners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    nock("https://www.cfadock.fr").post(/.*/).reply(404)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("opcos").deleteMany({})
    }
  })

  it("should not enrich when siret is missing", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: null,
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    // when
    await fillOpcoInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_opco, workplace_idcc } = job
    expect.soft(job.errors).toEqual([])
    expect.soft({ workplace_opco, workplace_idcc }).toEqual({ workplace_opco: null, workplace_idcc: null })
  })
  it("should enrich with cache when siret is present", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: "42476141900045",
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    await getDbCollection("opcos").insertOne({
      _id: new ObjectId(),
      siren: "424761419",
      opco: OPCOS_LABEL.AFDAS,
      idcc: "1313",
    })
    // when
    await fillOpcoInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_opco, workplace_idcc } = job
    expect.soft(job.errors).toEqual([])
    expect.soft({ workplace_opco, workplace_idcc }).toEqual({ workplace_opco: OPCOS_LABEL.AFDAS, workplace_idcc: 1313 })
  })
  it("should enrich with api when siret is present", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: "42476141900045",
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    nock.cleanAll()
    nock("https://www.cfadock.fr")
      .post(`/api/opcos`, [{ siret: "424761419" }])
      .reply(200, {
        found: [
          {
            filters: { siret: "424761419" },
            opcoName: OPCOS_LABEL.CONSTRUCTYS,
            searchStatus: "ok",
            idcc: 124,
          },
        ],
      })
    // when
    await fillOpcoInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_opco, workplace_idcc } = job
    expect.soft(job.errors).toEqual([])
    expect.soft({ workplace_opco, workplace_idcc }).toEqual({ workplace_opco: OPCOS_LABEL.CONSTRUCTYS, workplace_idcc: 124 })
  })
  it("should not fill idcc if not a number", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: "42476141900045",
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    await getDbCollection("opcos").insertOne({
      _id: new ObjectId(),
      siren: "424761419",
      opco: OPCOS_LABEL.AFDAS,
      idcc: "plop",
    })
    // when
    await fillOpcoInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_opco, workplace_idcc } = job
    expect.soft(job.errors).toEqual([])
    expect.soft({ workplace_opco, workplace_idcc }).toEqual({ workplace_opco: OPCOS_LABEL.AFDAS, workplace_idcc: null })
  })
  it("should set opco to unknown when data is not found", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        workplace_siret: "42476141900045",
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    // when
    await fillOpcoInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_opco, workplace_idcc } = job
    expect.soft(job.errors).toEqual([])
    expect.soft({ workplace_opco, workplace_idcc }).toEqual({ workplace_opco: OPCOS_LABEL.UNKNOWN_OPCO, workplace_idcc: null })
  })
  it("should be able to handle multiple documents", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id: "1",
        workplace_siret: "42476141900045",
        workplace_opco: null,
        workplace_idcc: null,
      },
      {
        partner_job_id: "2",
        workplace_siret: "42476141900032",
        workplace_opco: null,
        workplace_idcc: null,
      },
      {
        partner_job_id: "3",
        workplace_siret: "80841382700011",
        workplace_opco: null,
        workplace_idcc: null,
      },
      {
        partner_job_id: "4",
        workplace_siret: "12345678900011",
        workplace_opco: null,
        workplace_idcc: null,
      },
    ])
    await getDbCollection("opcos").insertMany([
      {
        _id: new ObjectId(),
        siren: "424761419",
        opco: OPCOS_LABEL.AFDAS,
        idcc: "1313",
      },
      {
        _id: new ObjectId(),
        siren: "808413827",
        opco: OPCOS_LABEL.AKTO,
      },
    ])
    // when
    await fillOpcoInfosForPartners()
    // then
    const jobs = (await getDbCollection("computed_jobs_partners").find({}).toArray()).sort((a, b) => (a.partner_job_id! < b.partner_job_id! ? -1 : 1))
    expect.soft(jobs.length).toBe(4)
    const [job1, job2, job3, job4] = jobs
    expect.soft(job1.errors).toEqual([])
    expect.soft(job2.errors).toEqual([])
    expect.soft(job3.errors).toEqual([])
    expect.soft(job4.errors).toEqual([
      {
        error: "data not found",
        source: "api_opco",
      },
    ])
    expect.soft(pick(job1, filledFields)).toEqual({ workplace_opco: OPCOS_LABEL.AFDAS, workplace_idcc: 1313 })
    expect.soft(pick(job2, filledFields)).toEqual({ workplace_opco: OPCOS_LABEL.AFDAS, workplace_idcc: 1313 })
    expect.soft(pick(job3, filledFields)).toEqual({ workplace_opco: OPCOS_LABEL.AKTO, workplace_idcc: null })
    expect.soft(pick(job4, filledFields)).toEqual({ workplace_opco: OPCOS_LABEL.UNKNOWN_OPCO, workplace_idcc: null })
  })
})
