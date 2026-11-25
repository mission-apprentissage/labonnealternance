import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { OPCOS_LABEL } from "shared/constants/index"
import { generateCacheInfoSiretForSiret } from "shared/fixtures/cache-info-siret.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { entriesToTypedRecord } from "shared/utils/index"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { blockJobsPartnersFromCfaList } from "./block-jobs-partners-from-cfa-list"
import { detectClassificationJobsPartners } from "./detect-classification-jobs-partners"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"

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
  "workplace_opco",
  "workplace_idcc",
] as const satisfies (keyof IComputedJobsPartners)[]
const emptyFilledObject = entriesToTypedRecord(filledFields.map((key) => [key, null]))

describe("fill-computed-jobs-partners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
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
  }, 10_000)
  it("bloque en NO_APPLY_METHOD, avant la classification, une offre sans moyen de candidature", async () => {
    const [given] = await givenSomeComputedJobPartners([{ partner_label: JOBPARTNERS_LABEL.HELLOWORK, apply_url: null, apply_email: null, apply_phone: null }])
    // Classification servie par le cache, sans appel Mistral : si elle passait en premier, elle marquerait l'offre.
    await getDbCollection("cache_classification").insertOne({
      _id: new ObjectId(),
      partner_label: given.partner_label,
      partner_job_id: given.partner_job_id,
      classification: "publish",
      scores: { publish: 0.9, unpublish: 0.1 },
      model: "mistral:test",
      created_at: new Date(),
    })

    await fillComputedJobsPartners()

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.NO_APPLY_METHOD)
    expect.soft(job.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
    expect.soft(job.validated).toBe(false)
  })
  describe("PARTNER_WHITELIST filtering for OPCO EP", () => {
    it("should not apply BLOCK_CFA_NAME to a job with partner_label 'OPCO EP'", async () => {
      // given: an "OPCO EP" job whose workplace_name contains a blocked CFA name
      await givenSomeComputedJobPartners([
        {
          partner_label: "OPCO EP",
          workplace_name: "13 EN FORM",
          business_error: null,
        },
      ])
      // when
      await blockJobsPartnersFromCfaList({})
      // then
      const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
      expect.soft(job.business_error).toBeNull()
      expect.soft(job.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.BLOCK_CFA_NAME)
    })

    it("should not apply CLASSIFICATION to a job with partner_label 'OPCO EP'", async () => {
      // given: an "OPCO EP" job with content that would normally trigger classification
      await givenSomeComputedJobPartners([
        {
          partner_label: "OPCO EP",
          offer_title: "formateur CFA",
          workplace_name: "école de formation",
          business_error: null,
        },
      ])
      // when — no Mistral mock needed: OPCO EP is filtered out by the query so getData is never called
      await detectClassificationJobsPartners({})
      // then
      const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
      expect.soft(job.business_error).toBeNull()
      expect.soft(job.jobs_in_success).not.toContain(COMPUTED_ERROR_SOURCE.CLASSIFICATION)
    })
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
    console.info(jobs[0].errors)

    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ validated: true })).toEqual(1)
  })
})
