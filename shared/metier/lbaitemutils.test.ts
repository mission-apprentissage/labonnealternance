import { describe, expect, it } from "vitest"

import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"

import { buildJobUrl, buildTrainingUrl, getDirectJobPath } from "./lbaitemutils.js"

describe("lbautils", () => {
  describe("buildJobUrl", () => {
    it("should build a job URL", () => {
      expect(buildJobUrl(LBA_ITEM_TYPE.RECRUTEURS_LBA, "123", "Job Title")).toBe("/emploi/recruteurs_lba/123/job-title")
    })
  })

  describe("buildTrainingUrl", () => {
    it("should build a training URL", () => {
      expect(buildTrainingUrl("123#aaa", "Job Title")).toBe("/formation/123%23aaa/job-title")
    })
  })

  describe("getDirectJobPath", () => {
    it("should build a direct job path", () => {
      expect(getDirectJobPath("123")).toBe("/emploi/offres_emploi_lba/123/offre")
    })

    it("should build a direct job path with title", () => {
      expect(getDirectJobPath("123", "titre de l'offre")).toBe("/emploi/offres_emploi_lba/123/titre-de-l-offre")
    })
  })
})
