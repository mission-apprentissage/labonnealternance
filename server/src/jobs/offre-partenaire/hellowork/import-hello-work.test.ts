import fs from "node:fs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importHelloWorkRaw, importHelloWorkToComputed } from "./import-hello-work"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("import-hello-work", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_hellowork").deleteMany({})
    }
  })

  it("should test the import of hellowork data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offre-partenaire/hellowork/import-hello-work.test.input.xml")
    await importHelloWorkRaw(fileStream)
    expect.soft(await getDbCollection("raw_hellowork").countDocuments({})).toBe(5)

    await importHelloWorkToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.HELLOWORK }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(5)
    expect.soft(jobs).toMatchSnapshot()
  })

  // échantillon réel du flux servi sur download.holeest.com : nouveau vocabulaire education/remote, guid == job_id
  it("should test the import of the new hellowork flux format", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offre-partenaire/hellowork/import-hello-work.new-format.test.input.xml")
    await importHelloWorkRaw(fileStream)
    expect.soft(await getDbCollection("raw_hellowork").countDocuments({})).toBe(3)

    await importHelloWorkToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.HELLOWORK }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    expect.soft(jobs.length).toBe(3)
    // les deux champs que l'ancien mapping laissait systématiquement vides sur ce vocabulaire
    expect.soft(jobs.map((job) => [job.offer_target_diploma?.european ?? null, job.contract_remote])).toEqual([
      ["3", "onsite"],
      [null, null],
      ["7", "hybrid"],
    ])
    expect.soft(jobs).toMatchSnapshot()
  })
})
