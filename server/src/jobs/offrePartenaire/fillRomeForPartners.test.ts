import nock from "nock"
import type { IDiagorienteClassificationResponseSchema } from "shared"
import { cacheDiagorienteFixture } from "shared/fixtures/cacheDiagoriente.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { fillRomeForPartners } from "./fillRomeForPartners"
import { nockDiagorienteAccessToken, nockDiagorienteRomeClassifier } from "@/common/apis/diagoriente/diagoriente.client.fixture"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("fillRomeForPartners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("cache_diagoriente").deleteMany({})
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
    const cacheDiagoriente = cacheDiagorienteFixture({
      title,
      sector: nafLabel,
      code_rome: romeCode,
      intitule_rome: "Chef de partie, second de cuisine",
    })
    await getDbCollection("cache_diagoriente").insertOne(cacheDiagoriente)
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
    const computedJob = await givenSomeComputedJobPartners([
      {
        offer_title: title,
        workplace_naf_label: nafLabel,
        offer_rome_codes: null,
      },
    ])
    nock.cleanAll()
    const apiResponseDiagoriente: IDiagorienteClassificationResponseSchema = {}
    apiResponseDiagoriente[computedJob[0]._id.toString()] = {
      classify_results: [
        {
          data: {
            _key: "key",
            item_version_id: "version_id",
            item_id: "item_id",
            titre: "Chef de partie, second de cuisine",
            valid_from: "2024-01-01",
            rome: romeCode,
            valid_to: null,
            item_type: "SousDomaine",
          },
        },
      ],
    }
    nockDiagorienteAccessToken()
    nockDiagorienteRomeClassifier(
      [
        {
          id: computedJob[0]._id.toString(),
          title,
          sector: nafLabel,
          description: computedJob[0].offer_description!,
        },
      ],
      apiResponseDiagoriente
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
  it("should enrich when offer_rome_codes is an empty array", async () => {
    // given
    const romeCode = "K1601"
    await givenSomeComputedJobPartners([
      {
        offer_title: title,
        workplace_naf_label: nafLabel,
        offer_rome_codes: [],
      },
    ])
    const cacheDiagoriente = cacheDiagorienteFixture({
      title,
      sector: nafLabel,
      code_rome: romeCode,
      intitule_rome: "Chef de partie, second de cuisine",
    })
    await getDbCollection("cache_diagoriente").insertOne(cacheDiagoriente)
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
