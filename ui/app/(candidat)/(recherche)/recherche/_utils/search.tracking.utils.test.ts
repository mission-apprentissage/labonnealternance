import { describe, expect, it } from "vitest"

import type { EmploisFallbackCount } from "../_hooks/use-emplois-fallback-count"
import type { ISearchPageParams } from "./search.params.utils"
import { activeFilterNames, createSearchKeyTracker, diffFilterChanges, diffSortChange, isSearchDisplaySettled, searchTypeOf } from "./search.tracking.utils"

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

  it("trace job_offer_type par valeur cochée/décochée (multi-sélection)", () => {
    expect(diffFilterChanges(base, { ...base, is_algo_company: [true] })).toEqual([{ action: "applied", filter_name: "job_offer_type", filter_value: "Entreprises à contacter" }])
    expect(diffFilterChanges({ ...base, is_algo_company: [true] }, { ...base, is_algo_company: [false] })).toEqual([
      { action: "applied", filter_name: "job_offer_type", filter_value: "Offres d'emploi en alternance" },
      { action: "removed", filter_name: "job_offer_type", filter_value: "Entreprises à contacter" },
    ])
    // Les deux cochées (aucun filtre API) : chaque case reste trackée individuellement.
    expect(diffFilterChanges({ ...base, is_algo_company: [false] }, { ...base, is_algo_company: [false, true] })).toEqual([
      { action: "applied", filter_name: "job_offer_type", filter_value: "Entreprises à contacter" },
    ])
    expect(diffFilterChanges({ ...base, is_algo_company: [false, true] }, { ...base, is_algo_company: [true] })).toEqual([
      { action: "removed", filter_name: "job_offer_type", filter_value: "Offres d'emploi en alternance" },
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
      is_algo_company: [false],
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

describe("diffSortChange", () => {
  it("détecte le passage du tri par défaut à un tri explicite (et retour)", () => {
    expect(diffSortChange(base, { ...base, sort: "date" })).toEqual({ sort_value: "date", previous_sort_value: "relevance" })
    expect(diffSortChange({ ...base, sort: "date" }, base)).toEqual({ sort_value: "relevance", previous_sort_value: "date" })
  })

  it("null si le tri est inchangé (y compris défaut → défaut)", () => {
    expect(diffSortChange(base, { ...base, contract_type: ["Apprentissage"] })).toBeNull()
    expect(diffSortChange({ ...base, sort: "proximity" }, { ...base, sort: "proximity", urgent: true })).toBeNull()
  })
})

describe("activeFilterNames", () => {
  it("liste les filter_name actifs dans le vocabulaire de la spec", () => {
    expect(activeFilterNames(base)).toEqual([])
    expect(
      activeFilterNames({
        ...base,
        is_algo_company: [true],
        start_date: "2026-09-01",
        level: ["Bac"],
        contract_type: ["Apprentissage"],
        handi: true,
        urgent: true,
        smart_apply: true,
      })
    ).toEqual(["job_offer_type", "contract_start_date", "education_level", "contract_type", "handi_friendly", "urgent_recruitment", "simplified_application"])
    expect(activeFilterNames({ ...base, mode: "formations", type_filter_label: ["Formation à distance"] })).toEqual(["distance_learning"])
  })
})

describe("searchTypeOf", () => {
  it("mappe les modes vers les valeurs de la spec", () => {
    expect(searchTypeOf("emplois")).toBe("jobs_only")
    expect(searchTypeOf("formations")).toBe("trainings_only")
    expect(searchTypeOf("emplois_formation")).toBe("jobs_and_trainings")
  })
})

/** Un rendu de SearchPageClient, vu par les effets d'affichage (searchKey, état de useSearchResults). */
type DisplayRender = { searchKey: string; hasData?: boolean; isPlaceholderData?: boolean; stillWidening?: boolean }

/** Rejoue la garde de l'effet search_results_displayed sur une suite de rendus d'une même instance. */
function replayResultsDisplayed(renders: DisplayRender[], tracker = createSearchKeyTracker()) {
  const emitted: string[] = []
  for (const r of renders) {
    const result = { data: r.hasData === false ? undefined : { pages: [] }, isPlaceholderData: r.isPlaceholderData ?? false }
    if (!isSearchDisplaySettled(result, r.stillWidening ?? false)) continue
    if (tracker.claim(r.searchKey)) emitted.push(r.searchKey)
  }
  return emitted
}

/** Rejoue la garde de l'effet search_mode_fallback_displayed. */
function replayFallbackDisplayed(renders: Array<{ searchKey: string; count: EmploisFallbackCount }>, tracker = createSearchKeyTracker()) {
  const emitted: string[] = []
  for (const { searchKey, count } of renders) {
    if (count.status !== "done" || count.count === 0) continue
    if (tracker.claim(searchKey)) emitted.push(searchKey)
  }
  return emitted
}

describe("search_results_displayed : une fois par recherche (#6052)", () => {
  // Retour sur A servi par le cache de React Query : données fraîches d'emblée, sans placeholder.
  it("n'émet pas de nouveau une recherche déjà suivie (A → B → A)", () => {
    const emitted = replayResultsDisplayed([{ searchKey: "A" }, { searchKey: "B", isPlaceholderData: true }, { searchKey: "B" }, { searchKey: "A" }])
    expect(emitted).toEqual(["A", "B"])
  })

  it("émet une nouvelle recherche après un retour", () => {
    expect(replayResultsDisplayed([{ searchKey: "A" }, { searchKey: "B" }, { searchKey: "A" }, { searchKey: "C" }])).toEqual(["A", "B", "C"])
  })

  it("n'émet pas de nouveau au rejeu des effets d'une instance réaffichée (<Activity>, retour arrière)", () => {
    const tracker = createSearchKeyTracker()
    replayResultsDisplayed([{ searchKey: "A" }, { searchKey: "B" }], tracker)
    // Fiche détail puis retour navigateur : l'instance masquée est réaffichée avec ses refs, ses
    // effets sont rejoués sur B, puis l'usager retire son filtre et revient sur A.
    expect(replayResultsDisplayed([{ searchKey: "B" }], tracker)).toEqual([])
    expect(replayResultsDisplayed([{ searchKey: "A" }], tracker)).toEqual([])
  })

  it("émet de nouveau après un rechargement de la page (nouvelle instance)", () => {
    replayResultsDisplayed([{ searchKey: "A" }])
    expect(replayResultsDisplayed([{ searchKey: "A" }])).toEqual(["A"])
  })

  it("attend les données de la recherche courante", () => {
    expect(replayResultsDisplayed([{ searchKey: "A", hasData: false }, { searchKey: "A", isPlaceholderData: true }, { searchKey: "A" }])).toEqual(["A"])
  })

  it("n'émet ni ne retient un palier d'élargissement du rayon (#5634), y compris au retour", () => {
    const emitted = replayResultsDisplayed([
      { searchKey: "A@20", stillWidening: true },
      { searchKey: "A@40", stillWidening: true },
      { searchKey: "A@60" },
      { searchKey: "B" },
      // Filtre retiré : les paliers de A sont rejoués depuis le cache jusqu'au dernier.
      { searchKey: "A@20", stillWidening: true },
      { searchKey: "A@40", stillWidening: true },
      { searchKey: "A@60" },
    ])
    expect(emitted).toEqual(["A@60", "B"])
  })
})

describe("search_mode_fallback_displayed : une fois par recherche (#6052)", () => {
  const done = (count: number): EmploisFallbackCount => ({ status: "done", count })

  it("n'émet pas de nouveau une proposition déjà suivie (A → B → A)", () => {
    const emitted = replayFallbackDisplayed([
      { searchKey: "A", count: done(5) },
      { searchKey: "B", count: done(3) },
      { searchKey: "A", count: done(5) },
    ])
    expect(emitted).toEqual(["A", "B"])
  })

  it("ne retient la recherche qu'à l'affichage de la proposition", () => {
    const emitted = replayFallbackDisplayed([
      { searchKey: "A", count: { status: "pending" } },
      { searchKey: "A", count: done(0) },
      { searchKey: "B", count: done(2) },
      { searchKey: "C", count: { status: "idle" } },
      { searchKey: "C", count: done(4) },
    ])
    expect(emitted).toEqual(["B", "C"])
  })
})
