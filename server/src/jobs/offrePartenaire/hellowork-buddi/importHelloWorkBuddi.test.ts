import fs from "node:fs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { importHelloWorkBuddiRaw, importHelloWorkBuddiToComputed } from "./importHelloWorkBuddi"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("importHelloWorkBuddi", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_hellowork_buddi").deleteMany({})
    }
  })

  it("should test the import of hellowork Buddi data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/hellowork-buddi/importHelloWorkBuddi.test.input.xml")
    await importHelloWorkBuddiRaw(fileStream)
    expect.soft(await getDbCollection("raw_hellowork_buddi").countDocuments({})).toBe(3)

    await importHelloWorkBuddiToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.HELLOWORK_BUDDI }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(3)
    expect.soft(jobs).toMatchSnapshot()
  })
})
