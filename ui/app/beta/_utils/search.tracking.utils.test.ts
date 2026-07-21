import { describe, expect, it } from "vitest"

import type { ISearchPageParams } from "./search.params.utils"
import { diffFilterChanges, searchTypeOf } from "./search.tracking.utils"

const base: ISearchPageParams = { mode: "emplois", radius: 20, page: 0, hitsPerPage: 20 }

describe("diffFilterChanges", () => {
  it("émet applied quand un toggle s'active, removed quand il se désactive", () => {
    expect(diffFilterChanges(base, { ...base, smart_apply: true })).toEqual([{ action: "applied", filter_name: "simplified_application", filter_value: "true" }])
    expect(diffFilterChanges({ ...base, urgent: true }, base)).toEqual([{ action: "removed", filter_name: "urgent_recruitment", filter_value: "true" }])
    expect(diffFilterChanges(base, { ...base, handi: true })).toEqual([{ action: "applied", filter_name: "handi_friendly", filter_value: "true" }])
  })

  it("émet un événement par valeur modifiée d'un multi-select", () => {
    const prev = { ...base, contract_type: ["Apprentissage"] }
    const next = { ...base, contract_type: ["Professionnalisation"] }
    expect(diffFilterChanges(prev, next)).toEqual([
      { action: "applied", filter_name: "contract_type", filter_value: "Professionnalisation" },
      { action: "removed", filter_name: "contract_type", filter_value: "Apprentissage" },
    ])
  })

  it("gère le tri-état job_offer_type (bascule = removed + applied)", () => {
    expect(diffFilterChanges(base, { ...base, is_algo_company: true })).toEqual([{ action: "applied", filter_name: "job_offer_type", filter_value: "Entreprises à contacter" }])
    expect(diffFilterChanges({ ...base, is_algo_company: true }, { ...base, is_algo_company: false })).toEqual([
      { action: "removed", filter_name: "job_offer_type", filter_value: "Entreprises à contacter" },
      { action: "applied", filter_name: "job_offer_type", filter_value: "Offres d'emploi en alternance" },
    ])
  })

  it("tronque la date de début au mois (YYYY-MM) et trace les changements", () => {
    expect(diffFilterChanges(base, { ...base, start_date: "2026-09-15" })).toEqual([{ action: "applied", filter_name: "contract_start_date", filter_value: "2026-09" }])
    expect(diffFilterChanges({ ...base, start_date: "2026-09-15" }, { ...base, start_date: "2026-10-01" })).toEqual([
      { action: "removed", filter_name: "contract_start_date", filter_value: "2026-09" },
      { action: "applied", filter_name: "contract_start_date", filter_value: "2026-10" },
    ])
    // Même mois, jour différent : pas d'événement (valeur trackée = le mois).
    expect(diffFilterChanges({ ...base, start_date: "2026-09-01" }, { ...base, start_date: "2026-09-20" })).toEqual([])
  })

  it("trace le niveau d'études (mono-sélection portée par une liste)", () => {
    expect(diffFilterChanges(base, { ...base, level: ["Cap, autres formations (Infrabac)"] })).toEqual([
      { action: "applied", filter_name: "education_level", filter_value: "Cap, autres formations (Infrabac)" },
    ])
  })

  it("trace la chip Formations à distance via type_filter_label", () => {
    expect(diffFilterChanges({ ...base, mode: "formations" }, { ...base, mode: "formations", type_filter_label: ["Formation à distance"] })).toEqual([
      { action: "applied", filter_name: "distance_learning", filter_value: "true" },
    ])
  })

  it("réinitialisation : un removed par valeur active", () => {
    const active: ISearchPageParams = {
      ...base,
      contract_type: ["Apprentissage"],
      level: ["Bac"],
      urgent: true,
      smart_apply: true,
      is_algo_company: false,
      start_date: "2026-09-01",
    }
    const changes = diffFilterChanges(active, base)
    expect(changes).toHaveLength(6)
    expect(changes.every((c) => c.action === "removed")).toBe(true)
  })

  it("ignore les changements hors filtres (q, lieu, tri, page)", () => {
    expect(diffFilterChanges(base, { ...base, q: "boulanger", lieu_label: "Paris", sort: "date", page: 3 })).toEqual([])
  })
})

describe("searchTypeOf", () => {
  it("mappe les modes vers les valeurs de la spec", () => {
    expect(searchTypeOf("emplois")).toBe("jobs_only")
    expect(searchTypeOf("formations")).toBe("trainings_only")
    expect(searchTypeOf("emplois_formation")).toBe("jobs_and_trainings")
  })
})
