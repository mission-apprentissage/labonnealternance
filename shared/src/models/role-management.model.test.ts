import { describe, expect, it } from "vitest"
import { DEACTIVATION_REASON_MAX_LENGTH, DEACTIVATION_REASON_MIN_LENGTH, ZDeactivationReason } from "./role-management.model.js"

describe("ZDeactivationReason", () => {
  it.each([
    ["vide", ""],
    ["sous le minimum", "a".repeat(DEACTIVATION_REASON_MIN_LENGTH - 1)],
    ["sous le minimum une fois les espaces retirés", `  ${"a".repeat(DEACTIVATION_REASON_MIN_LENGTH - 1)}  `],
    ["que des espaces", " ".repeat(DEACTIVATION_REASON_MIN_LENGTH + 2)],
    ["au-dessus du maximum", "a".repeat(DEACTIVATION_REASON_MAX_LENGTH + 1)],
  ])("refuse un motif %s", (_label, reason) => {
    expect(ZDeactivationReason.safeParse(reason).success).toBe(false)
  })

  it.each([
    ["au minimum", "a".repeat(DEACTIVATION_REASON_MIN_LENGTH)],
    ["au maximum", "a".repeat(DEACTIVATION_REASON_MAX_LENGTH)],
    ["au maximum une fois les espaces retirés", ` ${"a".repeat(DEACTIVATION_REASON_MAX_LENGTH)} `],
    ["sur plusieurs lignes", "ligne 1\nligne 2"],
  ])("accepte un motif %s", (_label, reason) => {
    expect(ZDeactivationReason.parse(reason)).toBe(reason.trim())
  })
})
