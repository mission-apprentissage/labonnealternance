import { describe, expect, it } from "vitest"
import { pickNextAccount } from "./use-next-account-to-review"

const a = { _id: "a", organizationId: "org-a" }
const b = { _id: "b", organizationId: "org-b" }
const c = { _id: "c", organizationId: "org-c" }

describe("pickNextAccount", () => {
  it("ne propose jamais le compte consulté", () => {
    expect(pickNextAccount([a], a)).toEqual({ next: null, remaining: 0 })
  })

  it("distingue deux rôles d'un même utilisateur sur des organisations différentes", () => {
    const autreOrganisation = { _id: "a", organizationId: "org-z" }
    expect(pickNextAccount([a, autreOrganisation], a)).toEqual({ next: autreOrganisation, remaining: 1 })
  })

  it("prend le compte qui suit dans la liste, puis repart du début", () => {
    expect(pickNextAccount([a, b, c], b)).toEqual({ next: c, remaining: 2 })
    expect(pickNextAccount([a, b, c], c)).toEqual({ next: a, remaining: 2 })
  })

  it("prend le premier compte quand le compte consulté n'est plus dans la liste", () => {
    expect(pickNextAccount([b, c], a)).toEqual({ next: b, remaining: 2 })
  })
})
