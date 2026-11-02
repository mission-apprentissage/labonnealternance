import { isAutoRadiusWidening } from "shared/utils/auto-radius"
import { describe, expect, it } from "vitest"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import type { AutoRadiusChain } from "./use-auto-radius"
import { autoRadiusTracking, extendAutoRadiusChain, nextAutoRadius } from "./use-auto-radius"

const geo: ISearchPageParams = { mode: "emplois", q: "horloger", latitude: 44.93, longitude: 2.44, lieu_label: "Aurillac", radius: 20, page: 0, hitsPerPage: 20 }

const keyOf = (p: ISearchPageParams) => JSON.stringify({ ...p, page: 0 })

/**
 * Rejoue SearchPageClient sur une suite de réponses (nbHits par palier) : un palier part tant que
 * isAutoRadiusWidening, et search_results_displayed n'est émis que sur la réponse qui l'arrête.
 */
function simulate(start: ISearchPageParams, nbHitsByRadius: Record<number, number>) {
  let params = start
  let chain: AutoRadiusChain | null = null
  const emitted: Array<{ total_results: number; radius: number } & ReturnType<typeof autoRadiusTracking>> = []
  for (;;) {
    const nbHits = nbHitsByRadius[params.radius] ?? 0
    if (!isAutoRadiusWidening(params, nbHits)) {
      emitted.push({ total_results: nbHits, radius: params.radius, ...autoRadiusTracking(chain, keyOf(params), params.radius) })
      return emitted
    }
    const next = { ...params, radius: nextAutoRadius(params.radius) }
    chain = extendAutoRadiusChain(chain, { searchKey: keyOf(params), radius: params.radius }, keyOf(next))
    params = next
  }
}

describe("search_results_displayed et élargissement du rayon (#5634)", () => {
  it("sans résultat jusqu'à 100 km : un seul événement, 4 paliers", () => {
    const emitted = simulate(geo, {})
    expect(emitted).toEqual([{ total_results: 0, radius: 100, auto_radius_steps: 4, initial_radius: 20 }])
  })

  it("vide à 20 km, trouvée à 60 km : un seul événement, 2 paliers", () => {
    const emitted = simulate(geo, { 60: 1 })
    expect(emitted).toEqual([{ total_results: 1, radius: 60, auto_radius_steps: 2, initial_radius: 20 }])
  })

  it("trouvée d'emblée : un seul événement, aucun palier", () => {
    const emitted = simulate(geo, { 20: 3 })
    expect(emitted).toEqual([{ total_results: 3, radius: 20, auto_radius_steps: 0, initial_radius: 20 }])
  })

  it("emprise administrative sans résultat : événement immédiat, aucun palier", () => {
    const emitted = simulate({ ...geo, admin_area: "departement:15" }, {})
    expect(emitted).toEqual([{ total_results: 0, radius: 20, auto_radius_steps: 0, initial_radius: 20 }])
  })

  it("repart du rayon courant pour une recherche lancée après un élargissement (filtre à 60 km)", () => {
    const emitted = simulate({ ...geo, radius: 60, smart_apply: true }, { 100: 2 })
    expect(emitted).toEqual([{ total_results: 2, radius: 100, auto_radius_steps: 2, initial_radius: 60 }])
  })
})

describe("extendAutoRadiusChain", () => {
  const from = { searchKey: "a@20", radius: 20 }

  it("est idempotente quand le même palier est redemandé avant que l'URL ne suive", () => {
    const chain = extendAutoRadiusChain(null, from, "a@40")
    expect(extendAutoRadiusChain(chain, from, "a@40")).toBe(chain)
  })

  it("ouvre une nouvelle chaîne quand le palier ne part pas du dernier de la chaîne en cours", () => {
    const chain = extendAutoRadiusChain(extendAutoRadiusChain(null, from, "a@40"), { searchKey: "a@40", radius: 40 }, "a@60")
    expect(extendAutoRadiusChain(chain, { searchKey: "b@20", radius: 20 }, "b@40")).toEqual({ searchKey: "b@40", initialRadius: 20, steps: 1 })
  })

  it("ne compte pas de palier pour une recherche hors de la chaîne", () => {
    const chain = extendAutoRadiusChain(null, from, "a@40")
    expect(autoRadiusTracking(chain, "b@40", 40)).toEqual({ auto_radius_steps: 0, initial_radius: 40 })
  })
})
