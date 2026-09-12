import { describe, expect, it } from "vitest"

import { buildAdminAreaClause } from "./admin-area"

describe("buildAdminAreaClause", () => {
  it("vise le champ de la maille demandée", () => {
    expect(buildAdminAreaClause({ kind: "departement", code: "44" })).toEqual({ equals: { path: "departement_code", value: "44" } })
    expect(buildAdminAreaClause({ kind: "region", code: "53" })).toEqual({ equals: { path: "region_code", value: "53" } })
  })
})
