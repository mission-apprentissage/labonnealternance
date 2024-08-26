import fs from "node:fs"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { importHelloWork } from "./importHelloWork"

describe("importHelloWork", () => {
  useMongo()

  it("should test the whole import", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offrePartenaire/importHelloWork.test.input.xml")
    await importHelloWork(fileStream)
    expect(await getDbCollection("raw_hellowork").countDocuments({})).toBe(5)
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.HELLOWORK }, { projection: { _id: 0, created_at: 0 } })
        .sort({ partner_id: 1 })
        .toArray()
    ).map((job) => ({ ...job, offer_creation_date: job.offer_creation_date?.toISOString() }))
    const expectedJson = JSON.parse(await fs.readFileSync("server/src/jobs/offrePartenaire/importHelloWork.test.expected.json", "utf-8"))
    expect(jobs).toEqual(expectedJson)
  })
})
