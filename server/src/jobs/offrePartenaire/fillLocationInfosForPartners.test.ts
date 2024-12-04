import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { generateFeaturePropertyFixture } from "shared/fixtures/geolocation.fixture"
import { clichyFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { saveGeolocationInCache } from "@/services/cacheGeolocation.service"

import { fillLocationInfosForPartners } from "./fillLocationInfosForPartners"

describe("fillLocationInfosForPartners", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("cache_geolocation").deleteMany({})
    }
  })

  it("should enrich with cache", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_address_label: "20 AVENUE DE SEGUR, 75007 PARIS",
        workplace_address_city: null,
        workplace_address_zipcode: null,
        workplace_address_street_label: null,
        workplace_geopoint: null,
      },
    ])
    await saveGeolocationInCache("20 AVENUE DE SEGUR, 75007 PARIS", [
      {
        type: "Feature",
        geometry: parisFixture.centre,
        properties: generateFeaturePropertyFixture({
          city: parisFixture.nom,
          postcode: parisFixture.codesPostaux[6],
          name: "20 AVENUE DE SEGUR",
          street: "AVENUE DE SEGUR",
        }),
      },
    ])
    // when
    await fillLocationInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_address_city, workplace_address_zipcode, workplace_address_street_label, workplace_address_label, workplace_geopoint } = job
    expect.soft(job.errors).toEqual([])
    expect
      .soft({
        workplace_address_city: parisFixture.nom,
        workplace_address_zipcode: parisFixture.codesPostaux[6],
        workplace_address_street_label: "20 AVENUE DE SEGUR",
        workplace_address_label: "20 AVENUE DE SEGUR 75007 Paris",
        workplace_geopoint: parisFixture.centre,
      })
      .toEqual({
        workplace_address_city,
        workplace_address_zipcode,
        workplace_address_street_label,
        workplace_address_label,
        workplace_geopoint,
      })
  })

  it("should enrich with api", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_address_label: "1T IMPASSE PASSOIR CLICHY",
        workplace_address_city: null,
        workplace_address_zipcode: null,
        workplace_address_street_label: null,
        workplace_geopoint: null,
      },
    ])

    nock("https://api-adresse.data.gouv.fr:443")
      .get("/search")
      .query({ q: "1T IMPASSE PASSOIR CLICHY", limit: "1" })
      .reply(200, {
        features: [
          {
            geometry: clichyFixture.centre,
            properties: generateFeaturePropertyFixture({
              city: clichyFixture.nom,
              postcode: clichyFixture.codesPostaux[0],
              name: "1T impasse Passoir",
              street: "impasse Passoir",
            }),
          },
        ],
      })

    // when
    await fillLocationInfosForPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { workplace_address_city, workplace_address_zipcode, workplace_address_street_label, workplace_address_label, workplace_geopoint } = job
    expect.soft(job.errors).toEqual([])
    expect
      .soft({
        workplace_address_city: clichyFixture.nom,
        workplace_address_zipcode: clichyFixture.codesPostaux[0],
        workplace_address_street_label: "1T impasse Passoir",
        workplace_address_label: "1T impasse Passoir 92110 Clichy",
        workplace_geopoint: clichyFixture.centre,
      })
      .toEqual({
        workplace_address_city,
        workplace_address_zipcode,
        workplace_address_street_label,
        workplace_address_label,
        workplace_geopoint,
      })
  })
})
