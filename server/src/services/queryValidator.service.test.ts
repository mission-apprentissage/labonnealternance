import { MAX_SEARCH_ROMES, MAX_SEARCH_ROMES_PRIVATE } from "shared"
import { describe, expect, it, vi } from "vitest"
import { formationsQueryValidator, jobsQueryValidatorPrivate } from "./queryValidator.service"

vi.mock("./external/api-alternance/certification.service", () => ({
  getRomesFromRncp: vi.fn(),
}))

vi.mock("@/common/utils/isOriginLocal", () => ({
  isOriginLocal: vi.fn(() => true),
}))

const generateRomes = (count: number) => Array.from({ length: count }, (_, i) => `A${String(i + 1).padStart(4, "0")}`).join(",")

describe("jobsQueryValidatorPrivate — limite romes", () => {
  const baseQuery = { caller: "test", isMinimalData: true }

  it(`accepte ${MAX_SEARCH_ROMES_PRIVATE} romes`, async () => {
    const result = await jobsQueryValidatorPrivate({ ...baseQuery, romes: generateRomes(MAX_SEARCH_ROMES_PRIVATE) })
    expect(result).toMatchObject({ result: "passed" })
  })

  it(`rejette ${MAX_SEARCH_ROMES_PRIVATE + 1} romes`, async () => {
    const result = await jobsQueryValidatorPrivate({ ...baseQuery, romes: generateRomes(MAX_SEARCH_ROMES_PRIVATE + 1) })
    expect(result).toMatchObject({ error: "wrong_parameters" })
    expect((result as { error_messages: string[] }).error_messages).toEqual(expect.arrayContaining([expect.stringContaining(`Maximum is ${MAX_SEARCH_ROMES_PRIVATE}`)]))
  })
})

describe("formationsQueryValidator — limite romes", () => {
  const baseQuery = { caller: "test", isMinimalData: true }

  it(`accepte ${MAX_SEARCH_ROMES} romes`, async () => {
    const result = await formationsQueryValidator({ ...baseQuery, romes: generateRomes(MAX_SEARCH_ROMES) })
    expect(result).toMatchObject({ result: "passed" })
  })

  it(`rejette ${MAX_SEARCH_ROMES + 1} romes`, async () => {
    const result = await formationsQueryValidator({ ...baseQuery, romes: generateRomes(MAX_SEARCH_ROMES + 1) })
    expect(result).toMatchObject({ error: "wrong_parameters" })
    expect((result as { error_messages: string[] }).error_messages).toEqual(expect.arrayContaining([expect.stringContaining(`Maximum is ${MAX_SEARCH_ROMES}`)]))
  })
})
