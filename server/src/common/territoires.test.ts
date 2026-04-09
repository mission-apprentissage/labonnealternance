import { describe, expect, it } from "vitest"

import { getDepartmentInfos } from "@/common/territoires"

describe("getDepartmentInfos", () => {
  it("should return department info for a standard zip code", () => {
    const result = getDepartmentInfos("75000")
    expect(result).toBeDefined()
    expect(result?.code).toBe("75")
    expect(result?.nom).toBe("Paris")
    expect(result?.region.code).toBe("11")
    expect(result?.academie.code).toBe("1")
  })

  it("should return department info for Corse-du-Sud (zip <= 20190)", () => {
    const result = getDepartmentInfos("20100")
    expect(result).toBeDefined()
    expect(result?.code).toBe("2A")
    expect(result?.nom).toBe("Corse-du-Sud")
  })

  it("should return department info for Haute-Corse (zip > 20190)", () => {
    const result = getDepartmentInfos("20200")
    expect(result).toBeDefined()
    expect(result?.code).toBe("2B")
    expect(result?.nom).toBe("Haute-Corse")
  })

  it("should return department info for a DOM zip code (972)", () => {
    const result = getDepartmentInfos("97200")
    expect(result).toBeDefined()
    expect(result?.code).toBe("972")
    expect(result?.nom).toBe("Martinique")
  })

  it("should return department info for a DOM zip code (974)", () => {
    const result = getDepartmentInfos("97400")
    expect(result).toBeDefined()
    expect(result?.code).toBe("974")
    expect(result?.nom).toBe("La Réunion")
  })

  it("should return undefined and log error for an unknown zip code", () => {
    const result = getDepartmentInfos("00000")
    expect(result).toBeUndefined()
  })

  it("should return department info when zip code is provided as a 3-digit department code", () => {
    const result = getDepartmentInfos("972")
    expect(result).toBeDefined()
    expect(result?.code).toBe("972")
  })
})
