import { describe, expect, it } from "vitest"

import { emploisFallbackParams } from "./mode-fallback.utils"
import type { ISearchPageParams } from "./search.params.utils"

const base: ISearchPageParams = { mode: "emplois_formation", radius: 100, page: 2, hitsPerPage: 20 }

describe("emploisFallbackParams", () => {
  it("passe en mode emplois, en première page", () => {
    expect(emploisFallbackParams(base)).toMatchObject({ mode: "emplois", page: 0 })
  })

  it("retire les filtres propres au corpus emplois_formation", () => {
    const params = emploisFallbackParams({
      ...base,
      type_filter_label: ["Offres d'emploi postées par des écoles"],
      organization_name: "CFA de test",
      is_algo_company: [false],
    })
    expect(params.type_filter_label).toBeUndefined()
    expect(params.organization_name).toBeUndefined()
    expect(params.is_algo_company).toBeUndefined()
  })

  it("garde la recherche, le lieu, le rayon, le tri et les filtres compatibles", () => {
    const kept = {
      q: "boulanger",
      q_source: "free_text",
      lieu_label: "Lyon",
      latitude: 45.76,
      longitude: 4.83,
      radius: 100,
      admin_area: "departement:69",
      contract_type: ["Apprentissage"],
      level: ["4"],
      activity_sector: ["Commerce"],
      start_date: "2026-12-01",
      urgent: true,
      handi: true,
      smart_apply: true,
      sort: "date",
      opco: "AKTO",
    } as const
    expect(emploisFallbackParams({ ...base, ...kept, contract_type: [...kept.contract_type], level: [...kept.level], activity_sector: [...kept.activity_sector] })).toMatchObject(
      kept
    )
  })
})
