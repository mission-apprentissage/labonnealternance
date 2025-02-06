import { ObjectId } from "bson"
import { RECRUITER_STATUS } from "shared/constants"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { JOB_STATUS, JOB_STATUS_ENGLISH } from "shared/models"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getPairs } from "@/common/utils/array"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { givenSomeJobPartners } from "@tests/fixture/givenSomeJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveRecruiter } from "@tests/utils/user.test.utils"

import { checkSimilarity, detectDuplicateJobPartners, isCanonicalForDuplicate, OfferRef } from "./detectDuplicateJobPartners"

const siret = "42476141900045"

describe("detectDuplicateJobPartners", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("recruiters").deleteMany({})
    }
  })
  const offerTitle = "Coiffeur(euse) H/F"

  it("should detect a duplicate with an exact match in the offer title and the siret (computed_job_partner)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        _id: new ObjectId("60646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
      {
        _id: new ObjectId("62646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
    ])
    // when
    await detectDuplicateJobPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    const [job, job2] = jobs
    expect.soft(job.duplicates).toEqual([
      {
        otherOfferId: job2._id,
        collectionName: "computed_jobs_partners",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
    expect.soft(job.business_error).toEqual(null)
    expect.soft(job2.duplicates).toEqual([
      {
        otherOfferId: job._id,
        collectionName: "computed_jobs_partners",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
    expect.soft(job2.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.DUPLICATE)
  }, 10_000)
  it("should detect a duplicate with an exact match in the offer title and the siret (job_partner)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        _id: new ObjectId("60646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
    ])
    await givenSomeJobPartners([
      {
        _id: new ObjectId("62646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      },
    ])
    // when
    await detectDuplicateJobPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    const [job] = jobs
    const [job2] = await getDbCollection("jobs_partners").find({}).toArray()
    expect.soft(job.duplicates).toEqual([
      {
        otherOfferId: job2._id,
        collectionName: "jobs_partners",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
    expect.soft(job.business_error).toEqual(null)
    expect.soft(job2.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
  }, 10_000)
  it("should detect a duplicate with an exact match in the offer title and the siret (recruiter)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        _id: new ObjectId("60646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
    ])
    const recruiter = await saveRecruiter(
      generateRecruiterFixture({
        _id: new ObjectId("62646425184afd00e017c1ab"),
        establishment_siret: siret,
        status: RECRUITER_STATUS.ACTIF,
        address_detail: {
          ...generateRecruiterFixture().address_detail,
          code_postal: "75007",
        },
        jobs: [
          generateJobFixture({
            rome_appellation_label: offerTitle,
            job_status: JOB_STATUS.ACTIVE,
          }),
        ],
      })
    )
    // when
    await detectDuplicateJobPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    const [job] = jobs
    expect.soft(job.duplicates).toEqual([
      {
        otherOfferId: recruiter.jobs[0]._id,
        collectionName: "recruiters",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.DUPLICATE)
  }, 10_000)
  it("should not detect a duplicate with an exact match in the offer title and the siret but a different zip code (computed_job_partner)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75002",
      },
      {
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
    ])
    // when
    await detectDuplicateJobPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    const [job, job2] = jobs
    expect.soft(job.duplicates).toEqual([])
    expect.soft(job2.duplicates).toEqual([])
  }, 10_000)
  it("should detect a duplicate with an exact match in the offer title and the siret (job_partner)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        _id: new ObjectId("60646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
    ])
    await givenSomeJobPartners([
      {
        _id: new ObjectId("62646425184afd00e017c1ab"),
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75005",
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      },
    ])
    // when
    await detectDuplicateJobPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    const [job] = jobs
    const [job2] = await getDbCollection("jobs_partners").find({}).toArray()
    expect.soft(job.duplicates).toEqual([])
    expect.soft(job.business_error).toEqual(null)
    expect.soft(job2.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  }, 10_000)
  it("should not detect a duplicate with an exact match in the offer title and the siret but a different zip code (recruiter)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75002",
      },
    ])
    await saveRecruiter(
      generateRecruiterFixture({
        establishment_siret: siret,
        status: RECRUITER_STATUS.ACTIF,
        address_detail: {
          ...generateRecruiterFixture().address_detail,
          code_postal: "75007",
        },
        jobs: [
          generateJobFixture({
            rome_appellation_label: offerTitle,
            job_status: JOB_STATUS.ACTIVE,
          }),
        ],
      })
    )
    // when
    await detectDuplicateJobPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    const [job] = jobs
    expect.soft(job.duplicates).toEqual([])
  }, 10_000)
  describe("checkSimilarity", () => {
    it("should not detect when one string is empty", async () => {
      expect.soft(checkSimilarity(undefined, offerTitle)).toEqual(undefined)
      expect.soft(checkSimilarity(null, offerTitle)).toEqual(undefined)
      expect.soft(checkSimilarity("", offerTitle)).toEqual(undefined)
      expect.soft(checkSimilarity(offerTitle, "")).toEqual(undefined)
      expect.soft(checkSimilarity(offerTitle, null)).toEqual(undefined)
      expect.soft(checkSimilarity(offerTitle, undefined)).toEqual(undefined)
    })
    it("should detect when strings are identical", () => {
      expect.soft(checkSimilarity(offerTitle, offerTitle)).toEqual("identical")
    })

    const groups = [
      ["H/F Coiffeur", "Coiffeur H/F", "Coiffeur", "Coiffeuse", "Coiffeur.se", "Coiffeur (H/F)"],
      ["Direction interministérielle du numérique", "Dir. interministérielle du numérique"],
      ["MFR la pignerie", "Maison familiale rurale la pignerie"],
      ["Chargé de mission en Ressources Humaines (RH) (H/F)", "Chargé de mission RH", "Chargé.e de mission RH"],
      // ["Drysoft", "dyrsoft"]
    ]
    groups.forEach((group) => {
      it.each(getPairs(group))("should detect similar strings: %s === %s", (item1, item2) => {
        expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
      })
    })
  })
  describe("isCanonicalForDuplicate", () => {
    describe("doit être une relation d ordre", () => {
      const offerRefs: OfferRef[] = [
        { collectionName: "computed_jobs_partners", rank: 0, created_at: new Date("2023-07-04T23:24:58.995Z") },
        { collectionName: "computed_jobs_partners", rank: 20, created_at: new Date("2024-07-04T23:24:58.995Z") },
        { collectionName: "computed_jobs_partners", rank: 10, created_at: new Date("2025-07-04T23:24:58.995Z") },
        { collectionName: "computed_jobs_partners", rank: 10, created_at: new Date("2024-07-04T23:24:58.995Z") },
        { collectionName: "recruiters", created_at: new Date("2024-07-04T23:24:58.995Z") },
        { collectionName: "recruiters", created_at: new Date("2026-07-04T23:24:58.995Z") },
        { collectionName: "recruiters", created_at: new Date("2025-07-04T23:24:58.995Z") },
      ]
      it("la relation doit être reflexive (xRx)", () => {
        offerRefs.forEach((offerRef) => expect(isCanonicalForDuplicate(offerRef, offerRef)).toBe(true))
      })
      it("la relation doit être antisymétrique (xRy and yRx => x = y)", () => {
        getPairs(offerRefs)
          .filter(([item, item2]) => isCanonicalForDuplicate(item, item2) && isCanonicalForDuplicate(item2, item))
          .forEach(([item, item2]) => expect(item).toBe(item2))
      })
      it("la relation doit être transitive (xRy and yRz => xRz)", () => {
        const validPairs = getPairs(offerRefs).flatMap(([item, item2]) => {
          const results: [OfferRef, OfferRef][] = []
          if (isCanonicalForDuplicate(item, item2)) {
            results.push([item, item2])
          }
          if (isCanonicalForDuplicate(item2, item)) {
            results.push([item2, item])
          }
          return results
        })
        getPairs(validPairs)
          .filter(([[_item, item2], [item3, _item4]]) => item2 === item3)
          .forEach(([[item, _item2], [_item3, item4]]) => expect(isCanonicalForDuplicate(item, item4)).toBe(true))
      })
      it("should sort the documents", () => {
        const sorted = [...offerRefs].sort((a, b) => (isCanonicalForDuplicate(a, b) ? -1 : 1))
        expect(sorted).toEqual([
          { collectionName: "recruiters", created_at: new Date("2024-07-04T23:24:58.995Z") },
          { collectionName: "recruiters", created_at: new Date("2025-07-04T23:24:58.995Z") },
          { collectionName: "recruiters", created_at: new Date("2026-07-04T23:24:58.995Z") },
          { collectionName: "computed_jobs_partners", rank: 20, created_at: new Date("2024-07-04T23:24:58.995Z") },
          { collectionName: "computed_jobs_partners", rank: 10, created_at: new Date("2024-07-04T23:24:58.995Z") },
          { collectionName: "computed_jobs_partners", rank: 10, created_at: new Date("2025-07-04T23:24:58.995Z") },
          { collectionName: "computed_jobs_partners", rank: 0, created_at: new Date("2023-07-04T23:24:58.995Z") },
        ])
      })
    })
  })
})
