import { describe, expect, it } from "vitest"

import { isValidEmail } from "@/common/utils/isValidEmail"

describe("Email", () => {
  it("should be valid", () => {
    const email = "test@email.com"
    expect(isValidEmail(email)).toEqual(true)
  })
  it("should be invalid", () => {
    expect(isValidEmail("t&zefzedaz@.com")).toEqual(false)
  })
})
