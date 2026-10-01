import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { ILbaItemPartnerJobJson } from "shared"
import { describe, expect, it } from "vitest"
import LbaJobAcces from "./LbaJobAcces"
import LbaJobQualites from "./LbaJobQualites"

const jobWith = (job: Record<string, unknown>) => ({ job }) as unknown as ILbaItemPartnerJobJson

describe("blocs de la fiche métier sur une offre sans champs ROME", () => {
  it("n'affiche rien pour des qualités vides", () => {
    expect(renderToStaticMarkup(createElement(LbaJobQualites, { job: jobWith({ offer_desired_skills: [] }) }))).toBe("")
  })

  it("n'affiche rien pour des conditions d'accès vides", () => {
    expect(renderToStaticMarkup(createElement(LbaJobAcces, { job: jobWith({ offer_access_conditions: [] }) }))).toBe("")
  })

  it("affiche les qualités et les conditions d'accès renseignées", () => {
    expect(renderToStaticMarkup(createElement(LbaJobQualites, { job: jobWith({ offer_desired_skills: ["Faire preuve de rigueur"] }) }))).toContain("Faire preuve de rigueur")
    expect(renderToStaticMarkup(createElement(LbaJobAcces, { job: jobWith({ offer_access_conditions: ["Accessible avec un CAP"] }) }))).toContain("Accessible avec un CAP")
  })

  it("affiche chaque condition d'accès séparément", () => {
    const html = renderToStaticMarkup(createElement(LbaJobAcces, { job: jobWith({ offer_access_conditions: ["Accessible avec un CAP.", "Permis B requis."] }) }))
    expect(html).toMatch(/Accessible avec un CAP\.<\/p>.*Permis B requis\.<\/p>/)
  })
})
