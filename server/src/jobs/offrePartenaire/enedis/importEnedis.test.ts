import fs from "node:fs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { importEnedisRaw, importEnedisToComputed } from "./importEnedis"

const now = new Date("2025-01-21T04:49:06.000+01:00")

describe("importEnedis", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_enedis").deleteMany({})
    }
  })

  it("should test the import of Enedis data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/enedis/importEnedis.test.input.xml")
    await importEnedisRaw(fileStream)
    expect.soft(await getDbCollection("raw_enedis").countDocuments({})).toBe(2)

    await importEnedisToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.ENEDIS }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(2)
    const jobsWithoutDates = jobs.map(({ offer_creation, offer_expiration, contract_start, updated_at, ...rest }) => rest)
    expect.soft(jobsWithoutDates).toMatchSnapshot()
    for (const job of jobs) {
      expect.soft(job.offer_creation).toBeInstanceOf(Date)
    }
  })
})
