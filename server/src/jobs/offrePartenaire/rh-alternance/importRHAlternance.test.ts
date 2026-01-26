import omit from "lodash-es/omit"
import { generateRawRHAlternanceJobFixture } from "shared/fixtures/rawRHAlternanceJob.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { rawRhAlternanceToComputedMapper } from "./importRHAlternance"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

describe("import RH Alternance", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_rhalternance").deleteMany({})
    }
  })

  describe("rawRhAlternanceToComputedMapper", () => {
    it("should test that the mapper works", async () => {
      const mapped = rawRhAlternanceToComputedMapper()(generateRawRHAlternanceJobFixture())
      expect.soft(mapped.business_error).toBeFalsy()
      expect.soft(omit(mapped, ["_id", "created_at", "updated_at"])).toMatchSnapshot()
    })
    it("should detect a business error", async () => {
      const mapped = rawRhAlternanceToComputedMapper()(
        generateRawRHAlternanceJobFixture({
          jobType: "invalid",
        })
      )
      expect.soft(mapped.business_error).toBeTruthy()
    })
  })
})
