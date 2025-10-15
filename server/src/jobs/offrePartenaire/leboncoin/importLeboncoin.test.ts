import fs from "node:fs"

import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { importLeboncoin, importLeboncoinToComputed } from "./importLeboncoin"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("importLeboncoin", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_leboncoin").deleteMany({})
    }
  })

  it("should test the import of Le bon coin emploi data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/leboncoin/importLeboncoin.test.input.csv")
    await importLeboncoin(fileStream)
    expect.soft(await getDbCollection("raw_leboncoin").countDocuments({})).toBe(2)

    await importLeboncoinToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.LEBONCOIN }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(2)
    expect.soft(jobs).toMatchSnapshot()
  })
})
