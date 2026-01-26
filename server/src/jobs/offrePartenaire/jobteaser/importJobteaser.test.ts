import fs from "node:fs"

import { omit } from "lodash-es"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { importJobteaserRaw, importJobteaserToComputed } from "./importJobteaser"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("importJobteaser", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_jobteaser").deleteMany({})
    }
  })

  it("should test the import of Jobteaser data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/jobteaser/importJobteaser.test.input.xml")
    await importJobteaserRaw(fileStream)
    expect.soft(await getDbCollection("raw_jobteaser").countDocuments({})).toBe(2)

    await importJobteaserToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.JOBTEASER }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    const filtered = jobs.map((x) => omit(x, ["offer_creation", "offer_expiration"]))
    expect.soft(jobs.length).toBe(2)
    expect.soft(filtered).toMatchSnapshot()
  })
})
