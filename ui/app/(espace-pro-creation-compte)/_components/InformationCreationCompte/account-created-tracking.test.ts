import { describe, expect, it } from "vitest"

import { getAccountCreatedTracking } from "./account-created-tracking"

describe("getAccountCreatedTracking", () => {
  it("entreprise validée", () => {
    expect(getAccountCreatedTracking("ENTREPRISE", true)).toEqual({ account_type: "entreprise", account_validated: "true" })
  })

  it("entreprise non validée", () => {
    expect(getAccountCreatedTracking("ENTREPRISE", false)).toEqual({ account_type: "entreprise", account_validated: "false" })
  })

  it("CFA validé", () => {
    expect(getAccountCreatedTracking("CFA", true)).toEqual({ account_type: "cfa", account_validated: "true" })
  })

  it("CFA en attente", () => {
    expect(getAccountCreatedTracking("CFA", false)).toEqual({ account_type: "cfa", account_validated: "false" })
  })
})
