import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { IRomeoAPIResponse } from "shared/models/cacheRomeo.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { cacheRomeFixture, cacheRomeResultFixture } from "../../../../shared/fixtures/cacheRome.fixture"

import { fillRomeForPartners } from "./fillRomeForPartners"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("fillRomeForPartners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    nock("https://api.francetravail.io").post(/.*/).reply(404)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("cache_romeo").deleteMany({})
    }
  })

  const title = "Chef de partie, second de cuisine H/F"

  it("should enrich with cache", async () => {
    // given
    const nafCode = "1105Z"
    const romeCode = "K1601"
    await givenSomeComputedJobPartners([
      {
        offer_title: title,
        workplace_naf_code: nafCode,
        offer_rome_codes: null,
      },
    ])
    const cacheRomeo = cacheRomeFixture({
      intitule: title,
      contexte: nafCode,
      metiersRome: [
        cacheRomeResultFixture({
          codeRome: romeCode,
        }),
      ],
    })
    await getDbCollection("cache_romeo").insertOne(cacheRomeo)
    // when
    await fillRomeForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { offer_rome_codes } = job
    expect.soft(job.errors).toEqual([])
    expect.soft(offer_rome_codes).toEqual([romeCode])
  })
  it("should enrich with api", async () => {
    // given
    const nafCode = "1105Z"
    const romeCode = "J1501"
    await givenSomeComputedJobPartners([
      {
        offer_title: title,
        workplace_naf_code: nafCode,
        offer_rome_codes: null,
      },
    ])
    nock.cleanAll()
    await getDbCollection("francetravail_access").insertOne({
      _id: new ObjectId(),
      access_token: "ft_token_romeo",
      access_type: "ROMEO",
      created_at: new Date(),
    })
    const apiResponse: IRomeoAPIResponse = [
      {
        intitule: title,
        identifiant: "0",
        contexte: nafCode,
        metiersRome: [
          cacheRomeResultFixture({
            codeRome: romeCode,
            scorePrediction: 0.8,
          }),
          cacheRomeResultFixture({
            codeRome: "ignored",
            scorePrediction: 0.7,
          }),
        ],
      },
    ]
    nock("https://api.francetravail.io")
      .post(`/partenaire/romeo/v2/predictionMetiers`, {
        appellations: [
          {
            intitule: title,
            identifiant: "0",
            contexte: nafCode,
          },
        ],
        options: { nomAppelant: "La bonne alternance" },
      })
      .reply(200, apiResponse)
    // when
    await fillRomeForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { offer_rome_codes } = job
    expect.soft(job.errors).toEqual([])
    expect.soft(offer_rome_codes).toEqual([romeCode])
  })
})
