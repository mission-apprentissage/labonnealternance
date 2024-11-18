import { useMongo } from "@tests/utils/mongo.test.utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { generateRawRHAlternanceJobFixture } from "../../../../shared/fixtures/rawRHAlternanceJob.fixture"

import { rawRhAlternanceToComputedMapper } from "./importRHAlternance"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("import RH Alternance", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_rhalternance").deleteMany({})
    }
  })

  describe("rawRhAlternanceToComputedMapper", () => {
    it("should test that the mapper works", async () => {
      expect.soft(rawRhAlternanceToComputedMapper(now)(generateRawRHAlternanceJobFixture())).toMatchSnapshot()
    })
  })
})
