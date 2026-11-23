import { describe, expect, expectTypeOf, it } from "vitest"

import { generateRecruiterRawFixture } from "../fixtures/recruiter-raw.fixture.js"

import type { IRecruteursLbaRaw } from "./raw-recruteurs-lba.model.js"
import { ZRecruteursLbaRaw } from "./raw-recruteurs-lba.model.js"

describe("ZRecruteursLbaRaw : provenance de l'email", () => {
  it("accepte un enregistrement sans les champs de provenance", () => {
    expect(ZRecruteursLbaRaw.safeParse(generateRecruiterRawFixture()).success).toBe(true)
  })

  it("accepte les champs de provenance valides", () => {
    const result = ZRecruteursLbaRaw.safeParse(generateRecruiterRawFixture({ email_source: "france_travail", email_confirme_deca: true, email_source_date: "2026-11-21" }))
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ email_source: "france_travail", email_confirme_deca: true, email_source_date: "2026-11-21" })
  })

  it("accepte des champs de provenance null", () => {
    expect(ZRecruteursLbaRaw.safeParse(generateRecruiterRawFixture({ email_source: "deca_maitre_apprentissage", email_source_date: null })).success).toBe(true)
    expect(ZRecruteursLbaRaw.safeParse(generateRecruiterRawFixture({ email_source: null, email_confirme_deca: null, email_source_date: null })).success).toBe(true)
  })

  it("rejette une source inconnue", () => {
    const result = ZRecruteursLbaRaw.safeParse({ ...generateRecruiterRawFixture(), email_source: "autre_source" })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["email_source"]])
  })

  it("rejette une date qui n'est pas au format AAAA-MM-JJ", () => {
    expect(ZRecruteursLbaRaw.safeParse({ ...generateRecruiterRawFixture(), email_source_date: "21/11/2026" }).success).toBe(false)
  })

  it("expose les champs de provenance dans IRecruteursLbaRaw", () => {
    expectTypeOf<IRecruteursLbaRaw["email_source"]>().toEqualTypeOf<"france_travail" | "deca_employeur" | "deca_maitre_apprentissage" | null | undefined>()
    expectTypeOf<IRecruteursLbaRaw["email_confirme_deca"]>().toEqualTypeOf<boolean | null | undefined>()
    expectTypeOf<IRecruteursLbaRaw["email_source_date"]>().toEqualTypeOf<string | null | undefined>()
  })
})
