import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { checkSimilarity, detectDuplicateJobPartners } from "./detectDuplicateJobPartners"

const siret = "42476141900045"

describe("detectDuplicateJobPartners", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })
  const offerTitle = "Coiffeur(euse) H/F"

  it("should detect a duplicate with an exact match in the offer title and the siret", async () => {
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
        reason: "identical workplace_siret, identical offer_title",
      },
    ])
    expect.soft(job2.duplicates).toEqual([
      {
        otherOfferId: job._id,
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

    const groupToPairs = (group: string[]) => group.flatMap((item1, index) => group.slice(index + 1).map((item2) => [item1, item2] as const))

    const coiffeurGroup = ["H/F Coiffeur", "Coiffeur H/F", "Coiffeur", "Coiffeuse", "Coiffeur.se", "Coiffeur (H/F)"]
    it.each(groupToPairs(coiffeurGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const directionGroup = ["Direction interministérielle du numérique", "Dir. interministérielle du numérique"]
    it.each(groupToPairs(directionGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const sigleGroup = ["MFR la pignerie", "Maison familiale rurale la pignerie"]
    it.each(groupToPairs(sigleGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const sensSimilaireGroup = ["Chargé de mission en Ressources Humaines (RH) (H/F)", "Chargé de mission RH", "Chargé.e de mission RH"]
    it.each(groupToPairs(sensSimilaireGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })

    const typoGroup = ["Drysoft", "dyrsoft"]
    it.skip.each(groupToPairs(typoGroup))("should detect similar strings: %s === %s", (item1, item2) => {
      expect.soft(checkSimilarity(item1, item2)).toEqual(expect.stringContaining("similar"))
    })
  })
})
