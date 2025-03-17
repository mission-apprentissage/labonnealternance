import nock from "nock"
import { cacheRomeFixture, cacheRomeResultFixture } from "shared/fixtures/cacheRome.fixture"
import { IRomeoAPIResponse } from "shared/models/cacheRomeo.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { nockFranceTravailRomeo, nockFranceTravailTokenAccessRomeo } from "@/common/apis/franceTravail/franceTravail.client.fixture"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

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
  const nafLabel = "Commerce de détail d'habillement en magasin spécialisé"

  it("should enrich with cache", async () => {
    // given
    const romeCode = "K1601"
    await givenSomeComputedJobPartners([
      {
        offer_title: title,
        workplace_naf_label: nafLabel,
        offer_rome_codes: null,
      },
    ])
    const cacheRomeo = cacheRomeFixture({
      intitule: title,
      contexte: nafLabel,
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
    const romeCode = "J1501"
    await givenSomeComputedJobPartners([
      {
        offer_title: title,
        workplace_naf_label: nafLabel,
        offer_rome_codes: null,
      },
    ])
    nock.cleanAll()
    nockFranceTravailTokenAccessRomeo()
    const apiResponse: IRomeoAPIResponse = [
      {
        intitule: title,
        identifiant: "0",
        contexte: nafLabel,
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
    nockFranceTravailRomeo(
      [
        {
          intitule: title,
          identifiant: "0",
          contexte: nafLabel,
        },
      ],
      apiResponse
    )
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
