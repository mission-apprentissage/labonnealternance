import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveRecruiter } from "@tests/utils/user.test.utils"
import { RECRUITER_STATUS } from "shared/constants"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { JOB_STATUS } from "shared/models"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getPairs } from "@/common/utils/array"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { checkSimilarity, detectDuplicateJobPartners } from "./detectDuplicateJobPartners"

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
      },
      {
        partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
        workplace_siret: siret,
        offer_title: offerTitle,
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
      },
    ])
    const recruiter = await saveRecruiter(
      generateRecruiterFixture({
        establishment_siret: siret,
        status: RECRUITER_STATUS.ACTIF,
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

    const coiffeurGroup = ["H/F Coiffeur", "Coiffeur H/F", "Coiffeur", "Coiffeuse", "Coiffeur.se", "Coiffeur (H/F)"]
    it.each(getPairs(coiffeurGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const directionGroup = ["Direction interministérielle du numérique", "Dir. interministérielle du numérique"]
    it.each(getPairs(directionGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const sigleGroup = ["MFR la pignerie", "Maison familiale rurale la pignerie"]
    it.each(getPairs(sigleGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const sensSimilaireGroup = ["Chargé de mission en Ressources Humaines (RH) (H/F)", "Chargé de mission RH", "Chargé.e de mission RH"]
    it.each(getPairs(sensSimilaireGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const typoGroup = ["Drysoft", "dyrsoft"]
    it.skip.each(getPairs(typoGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })
  })
})
