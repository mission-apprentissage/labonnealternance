import fs from "node:fs"

import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { importFranceTravailCEGIDRaw, importFranceTravailCEGIDToComputed } from "./importFranceTravailCEGID"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("importFranceTravailCEGID", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_france_travail_cegid").deleteMany({})
    }
  })

  it("should test the import of data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/france-travail-CEGID/importFranceTravailCEGID.test.input.json")
    await importFranceTravailCEGIDRaw(fileStream)
    expect.soft(await getDbCollection("raw_france_travail_cegid").countDocuments({})).toBe(3)

    await importFranceTravailCEGIDToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(3)
    expect.soft(jobs).toMatchSnapshot()
  })
})
