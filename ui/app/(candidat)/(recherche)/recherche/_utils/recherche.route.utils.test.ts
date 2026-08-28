import { describe, expect, it } from "vitest"

import { buildRecherchePageParams, IRechercheMode, parseRecherchePageParams } from "./recherche.route.utils"

/**
 * Ce module a perdu ses schémas zod (le type `IRecherchePageParams` est désormais explicite) :
 * ces tests remplacent la validation qui était jusqu'ici portée par zod. Les cas qui doivent
 * répondre *faux* passent en premier — c'est là que la réécriture peut régresser sans que rien
 * ne le signale.
 */
describe("parseRecherchePageParams", () => {
  it("retourne null sans searchParams", () => {
    expect(parseRecherchePageParams(null, IRechercheMode.DEFAULT)).toBeNull()
  })

  it("applique les valeurs par défaut sur une URL nue", () => {
    const params = parseRecherchePageParams(new URLSearchParams(""), IRechercheMode.DEFAULT)
    expect(params).toMatchObject({
      romes: [],
      geo: null,
      radius: 30,
      diploma: null,
      displayEntreprises: true,
      displayFormations: true,
      displayFilters: true,
    })
  })

  it("ignore une géo incomplète (address seule, sans lat/lon)", () => {
    const params = parseRecherchePageParams(new URLSearchParams("address=Lyon"), IRechercheMode.DEFAULT)
    expect(params.geo).toBeNull()
  })

  it("rejette un diploma hors référentiel", () => {
    expect(parseRecherchePageParams(new URLSearchParams("diploma=42+(Inexistant)"), IRechercheMode.DEFAULT).diploma).toBeNull()
  })

  it("force les toggles d'affichage en mode formations-only", () => {
    const params = parseRecherchePageParams(new URLSearchParams("displayEntreprises=true&displayFilters=true"), IRechercheMode.FORMATIONS_ONLY)
    expect(params).toMatchObject({ displayEntreprises: false, displayFormations: true, displayFilters: false })
  })

  it("fait un round-trip avec buildRecherchePageParams", () => {
    const query = buildRecherchePageParams(
      {
        romes: ["M1805"],
        geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
        radius: 60,
        job_name: "Data analyst",
      },
      IRechercheMode.DEFAULT
    )
    expect(parseRecherchePageParams(new URLSearchParams(query), IRechercheMode.DEFAULT)).toMatchObject({
      romes: ["M1805"],
      geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
      radius: 60,
      job_name: "Data analyst",
    })
  })
})
