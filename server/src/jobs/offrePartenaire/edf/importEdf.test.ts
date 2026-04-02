import fs from "node:fs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { importEdfRaw, importEdfToComputed } from "./importEDF"

const now = new Date("2026-02-01T00:00:00.000Z")

describe("importEdf", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_edf").deleteMany({})
    }
  })

  it("should import EDF data into raw_edf then computed_jobs_partners, filtering non-alternance offers", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/edf/importEdf.test.input.xml")
    await importEdfRaw(fileStream)
    // The test XML has 3 offers (2 alternance, 1 VIE)
    expect.soft(await getDbCollection("raw_edf").countDocuments({})).toBe(3)

    await importEdfToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.EDF }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    // Only the 2 alternance offers should be imported (VIE is filtered out)
    expect.soft(jobs.length).toBe(2)
    // Omit timezone-sensitive date fields to avoid CI vs local discrepancies
    const jobsWithoutDates = jobs.map(({ offer_creation, offer_expiration, contract_start, updated_at, ...rest }) => rest)
    expect.soft(jobsWithoutDates).toMatchSnapshot()
    for (const job of jobs) {
      expect.soft(job.offer_creation).toBeInstanceOf(Date)
    }
  })
})
