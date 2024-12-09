import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveRecruiter } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { RECRUITER_STATUS } from "shared/constants"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { JOB_STATUS } from "shared/models"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getPairs } from "@/common/utils/array"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { checkSimilarity, detectDuplicateJobPartners, isCanonicalForDuplicate, OfferRef } from "./detectDuplicateJobPartners"

const siret = "42476141900045"

describe("detectDuplicateJobPartners", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("recruiters").deleteMany({})
    }
  })
  const offerTitle = "Coiffeur(euse) H/F"

  it("should detect a duplicate with an exact match in the offer title and the siret (job_partner)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
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
    expect.soft(job.duplicates).toEqual([
      {
        otherOfferId: job2._id,
        collectionName: "computed_jobs_partners",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
    expect.soft(job2.duplicates).toEqual([
      {
        otherOfferId: job._id,
        collectionName: "computed_jobs_partners",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
  })
  it("should detect a duplicate with an exact match in the offer title and the siret (recruiter)", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
        workplace_address_zipcode: "75007",
      },
    ])
    const recruiter = await saveRecruiter(
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
    expect.soft(job.duplicates).toEqual([
      {
        otherOfferId: recruiter.jobs[0]._id,
        collectionName: "recruiters",
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
  })
  it("should not detect a duplicate with an exact match in the offer title and the siret but a different zip code (job_partner)", async () => {
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
  })
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
  })
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
    // cf https://www.math.univ-toulouse.fr/~msablik/Cours/MathDiscretes/Slide4-Relation.pdf
    describe("doit être une relation d ordre", () => {
      const offerRefs: OfferRef[] = [
        { collectionName: "recruiters", _id: new ObjectId("60646425184afd00e017c1ab") },
        { collectionName: "recruiters", _id: new ObjectId("642605b7c52247005267027e") },
        { collectionName: "recruiters", _id: new ObjectId("682605b7c52247005267027e") },
        { collectionName: "computed_jobs_partners", _id: new ObjectId("6525231132fe045f240e4bcd") },
        { collectionName: "computed_jobs_partners", _id: new ObjectId("67347c0c9af58cb6e6ebbb65") },
        { collectionName: "computed_jobs_partners", _id: new ObjectId("63347c0c9af58cb6e6ebbb65") },
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
    })
  })
})
