import { ObjectId } from "mongodb"
import nock from "nock"
import { OPCOS_LABEL } from "shared/constants"
import { generateCacheInfoSiretForSiret } from "shared/fixtures/cacheInfoSiret.fixture"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { entriesToTypedRecord } from "shared/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { fillComputedJobsPartners } from "./fillComputedJobsPartners"

const now = new Date("2024-07-21T04:49:06.000+02:00")
const filledFields = [
  "workplace_size",
  "workplace_name",
  "workplace_address_label",
  "workplace_geopoint",
  "workplace_naf_code",
  "workplace_naf_label",
  "workplace_brand",
  "workplace_legal_name",
  "workplace_opco",
  "workplace_idcc",
] as const satisfies (keyof IComputedJobsPartners)[]
const emptyFilledObject = entriesToTypedRecord(filledFields.map((key) => [key, null]))

describe("fillComputedJobsPartners", () => {
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
    await fillComputedJobsPartners()
    // then
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ validated: false })).toEqual(1)
  })
  // TODO à activer quand tous les enrichissements sont implémentés
  it.skip("should enrich when siret is present", async () => {
    // given
    const siret = "12345678900023"
    await givenSomeComputedJobPartners([
      {
        workplace_siret: siret,
        ...emptyFilledObject,
      },
    ])
    await getDbCollection("cache_siret").insertOne(generateCacheInfoSiretForSiret(siret))
    await getDbCollection("opcos").insertOne({
      _id: new ObjectId(),
      siren: siret.substring(0, 9),
      opco: OPCOS_LABEL.AFDAS,
      idcc: 1313,
    })
    // when
    await fillComputedJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    console.log(jobs[0].errors)

    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ validated: true })).toEqual(1)
  })
})
