import { describe, expect, it } from "vitest"

import { validatePhone } from "./phoneValidator.js"

describe("validatePhone", () => {
  it("should success converting a french number and validate it", () => expect(validatePhone("0132568790")).toBe(true))
  it("should throw error as it's a premium rate phone number", () => expect(validatePhone("0813458765")).toBe(false))
  it("should throw error as it's malformed", () => expect(validatePhone("0013458765")).toBe(false))
})
