import type { ISearchPageParams, SearchMode } from "./search.params.utils"

/**
 * Télémétrie des filtres du nouveau moteur (specs Notion « Tracking Matomo », 21/07/2026) :
 * traduit un changement de params en événements search_filter_applied / search_filter_removed,
 * un par valeur modifiée. Les compteurs (active_filters_count, results_count) sont ajoutés au
 * moment du push, une fois les résultats de la nouvelle recherche affichés.
 */

export type FilterChangeAction = "applied" | "removed"

export interface FilterChange {
  action: FilterChangeAction
  filter_name: string
  filter_value: string
}

const TYPE_FILTER_LABEL_DISTANCE = "Formation à distance"

// is_algo_company est multi-valeurs : false = offres d'emploi, true = entreprises à
// contacter. Les deux cochées ou aucune = pas de filtre API, mais chaque case reste
// trackée individuellement (un événement par valeur cochée/décochée).
const JOB_OFFER_TYPE_LABELS: Record<"true" | "false", string> = {
  false: "Offres d'emploi en alternance",
  true: "Entreprises à contacter",
}

const jobOfferTypeLabels = (values: boolean[] = []): string[] => values.map((v) => JOB_OFFER_TYPE_LABELS[String(v) as "true" | "false"])

function diffList(name: string, prev: string[] = [], next: string[] = []): FilterChange[] {
  return [
    ...next.filter((v) => !prev.includes(v)).map((v): FilterChange => ({ action: "applied", filter_name: name, filter_value: v })),
    ...prev.filter((v) => !next.includes(v)).map((v): FilterChange => ({ action: "removed", filter_name: name, filter_value: v })),
  ]
}

function diffToggle(name: string, prev?: boolean, next?: boolean): FilterChange[] {
  if (Boolean(prev) === Boolean(next)) return []
  return [{ action: next ? "applied" : "removed", filter_name: name, filter_value: "true" }]
}

/** Un événement par valeur modifiée entre deux états de filtres (cf. table filter_name de la spec). */
export function diffFilterChanges(prev: ISearchPageParams, next: ISearchPageParams): FilterChange[] {
  const changes: FilterChange[] = []

  changes.push(...diffList("job_offer_type", jobOfferTypeLabels(prev.is_algo_company), jobOfferTypeLabels(next.is_algo_company)))

  // contract_start_date : valeur au mois (YYYY-MM — la spec ne veut pas le jour).
  const prevMonth = prev.start_date?.slice(0, 7)
  const nextMonth = next.start_date?.slice(0, 7)
  if (prevMonth !== nextMonth) {
    if (prevMonth) changes.push({ action: "removed", filter_name: "contract_start_date", filter_value: prevMonth })
    if (nextMonth) changes.push({ action: "applied", filter_name: "contract_start_date", filter_value: nextMonth })
  }

  changes.push(...diffList("education_level", prev.level, next.level))
  changes.push(...diffList("contract_type", prev.contract_type, next.contract_type))

  changes.push(...diffToggle("handi_friendly", prev.handi, next.handi))
  changes.push(...diffToggle("urgent_recruitment", prev.urgent, next.urgent))
  changes.push(...diffToggle("simplified_application", prev.smart_apply, next.smart_apply))
  // Hors table de la spec (validé) : seul filtre du mode formations.
  changes.push(...diffToggle("distance_learning", prev.type_filter_label?.includes(TYPE_FILTER_LABEL_DISTANCE), next.type_filter_label?.includes(TYPE_FILTER_LABEL_DISTANCE)))

  return changes
}

/** Valeurs search_type de l'événement search_type_changed (spec §2.4). */
export function searchTypeOf(mode: SearchMode): "jobs_only" | "trainings_only" | "jobs_and_trainings" {
  switch (mode) {
    case "emplois":
      return "jobs_only"
    case "formations":
      return "trainings_only"
    case "emplois_formation":
      return "jobs_and_trainings"
  }
}
