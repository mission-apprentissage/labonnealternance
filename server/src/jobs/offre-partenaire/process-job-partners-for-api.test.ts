import { useMongo } from "@tests/utils/mongo.test.utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import * as fillComputedJobsPartnersModule from "./fill-computed-jobs-partners"
import { processJobPartnersForApi, processJobPartnersWithFilter } from "./process-job-partners-for-api"

vi.mock("./fill-computed-jobs-partners", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./fill-computed-jobs-partners")>()
  return { ...actual, fillComputedJobsPartners: vi.fn(async () => undefined) }
})

describe("processJobPartnersForApi / processJobPartnersWithFilter", () => {
  useMongo()

  afterEach(async () => {
    vi.mocked(fillComputedJobsPartnersModule.fillComputedJobsPartners).mockClear()
    await getDbCollection("computed_jobs_partners").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("processJobPartnersForApi devrait appeler fillComputedJobsPartners avec skipCfaAndClassificationDetection à true", async () => {
    // when
    await processJobPartnersForApi()
    // then
    expect(fillComputedJobsPartnersModule.fillComputedJobsPartners).toHaveBeenCalledTimes(1)
    const [context] = vi.mocked(fillComputedJobsPartnersModule.fillComputedJobsPartners).mock.calls[0]
    expect(context).toMatchObject({ skipCfaAndClassificationDetection: true })
  })

  it("processJobPartnersWithFilter ne devrait pas activer skipCfaAndClassificationDetection", async () => {
    // when
    await processJobPartnersWithFilter({})
    // then
    expect(fillComputedJobsPartnersModule.fillComputedJobsPartners).toHaveBeenCalledTimes(1)
    const [context] = vi.mocked(fillComputedJobsPartnersModule.fillComputedJobsPartners).mock.calls[0]
    expect(context?.skipCfaAndClassificationDetection).toBeUndefined()
  })
})
