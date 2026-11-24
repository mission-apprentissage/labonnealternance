import { referrers } from "shared/constants/referers"
import type { IETFAAdminParameterJson, IReferrerName } from "shared/models/elligible-training.model"

export type IFormation = IETFAAdminParameterJson

export const PLATFORMS: { name: IReferrerName; label: string; short: string }[] = [
  { name: "PARCOURSUP", label: referrers.PARCOURSUP.full_name, short: "Parcoursup" },
  { name: "LBA", label: referrers.LBA.full_name, short: "LBA" },
  { name: "ONISEP", label: referrers.ONISEP.full_name, short: "ONISEP" },
  { name: "JEUNE_1_SOLUTION", label: referrers.JEUNE_1_SOLUTION.full_name, short: "1J1S" },
  { name: "AFFELNET", label: referrers.AFFELNET.full_name, short: "Affelnet" },
]

export type IDiffusionState = { active: boolean; forced: boolean; eligible: boolean; auto: boolean }

export const getDiffusionState = (formation: IFormation, referrer: IReferrerName): IDiffusionState => ({
  active: formation.referrers.includes(referrer),
  forced: Boolean(formation.referrers_forced_on?.includes(referrer) || formation.referrers_forced_off?.includes(referrer)),
  eligible: formation.referrers_eligible.includes(referrer),
  auto: formation.referrers_auto.includes(referrer),
})

export const hasForcedReferrer = (formation: IFormation) => Boolean(formation.referrers_forced_on?.length || formation.referrers_forced_off?.length)

export type IEmailFilter = "all" | "custom" | "catalogue" | "missing"
// none, forced, on:<plateforme>, off:<plateforme>
export type IDiffusionFilter = "all" | "none" | "forced" | `on:${IReferrerName}` | `off:${IReferrerName}`

export type IFormationFilters = { query: string; email: IEmailFilter; diffusion: IDiffusionFilter; emailGroup: string | null }

export const DEFAULT_FILTERS: IFormationFilters = { query: "", email: "all", diffusion: "all", emailGroup: null }

export const MISSING_EMAIL_GROUP = "__sans_email__"
export const emailGroupOf = (formation: IFormation) => formation.lieu_formation_email || MISSING_EMAIL_GROUP

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

const matchesQuery = (formation: IFormation, query: string) => {
  const needle = normalize(query.trim())
  if (!needle) return true
  return [
    formation.training_intitule_long,
    formation.cle_ministere_educatif,
    formation.parcoursup_id,
    formation.lieu_formation_zip_code,
    formation.lieu_formation_city,
    formation.lieu_formation_email,
  ].some((value) => value && normalize(value).includes(needle))
}

const matchesEmail = (formation: IFormation, filter: IEmailFilter) => {
  if (filter === "missing") return !formation.lieu_formation_email
  if (filter === "custom") return Boolean(formation.lieu_formation_email && formation.is_lieu_formation_email_customized)
  if (filter === "catalogue") return Boolean(formation.lieu_formation_email && !formation.is_lieu_formation_email_customized)
  return true
}

const matchesDiffusion = (formation: IFormation, filter: IDiffusionFilter) => {
  if (filter === "all") return true
  if (filter === "none") return formation.referrers.length === 0
  if (filter === "forced") return hasForcedReferrer(formation)
  const [mode, referrer] = filter.split(":") as ["on" | "off", IReferrerName]
  return formation.referrers.includes(referrer) === (mode === "on")
}

export const filterFormations = (formations: IFormation[], filters: IFormationFilters) =>
  formations.filter(
    (formation) =>
      matchesQuery(formation, filters.query) &&
      matchesEmail(formation, filters.email) &&
      matchesDiffusion(formation, filters.diffusion) &&
      (filters.emailGroup === null || emailGroupOf(formation) === filters.emailGroup)
  )

// Adresses les plus utilisées d'abord, formations sans e-mail en dernier.
export const groupByEmail = (formations: IFormation[]) => {
  const counts = new Map<string, number>()
  for (const formation of formations) counts.set(emailGroupOf(formation), (counts.get(emailGroupOf(formation)) ?? 0) + 1)
  return [...counts.entries()]
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => Number(a.email === MISSING_EMAIL_GROUP) - Number(b.email === MISSING_EMAIL_GROUP) || b.count - a.count || a.email.localeCompare(b.email))
}

export const summarizeEmailChange = (formations: IFormation[], email: string) => {
  const target = email.trim()
  const summary = { fromCatalogue: 0, fromCustom: 0, filled: 0, unchanged: 0 }
  for (const formation of formations) {
    if (!formation.lieu_formation_email) summary.filled++
    else if (formation.lieu_formation_email === target) summary.unchanged++
    else if (formation.is_lieu_formation_email_customized) summary.fromCustom++
    else summary.fromCatalogue++
  }
  return summary
}
