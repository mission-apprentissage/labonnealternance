import fs from "node:fs"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { importHelloWorkRaw, importHelloWorkToComputed } from "./importHelloWork"

describe("importHelloWork", () => {
  useMongo()

  it("should test the whole import", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/importHelloWork.test.input.xml")
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
})
