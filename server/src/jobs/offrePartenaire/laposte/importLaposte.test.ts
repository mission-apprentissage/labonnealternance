import fs from "node:fs"

import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { importLaposteRaw, importLaposteToComputed } from "./importLaposte"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("importLaposte", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_hellowork").deleteMany({})
    }
  })

  it("should test the import of La Poste data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/laposte/importLaposte.test.input.xml")
    await importLaposteRaw(fileStream)
    expect.soft(await getDbCollection("raw_laposte").countDocuments({})).toBe(2)

    await importLaposteToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.LAPOSTE }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(2)
    expect.soft(jobs).toMatchSnapshot()
  })
})
