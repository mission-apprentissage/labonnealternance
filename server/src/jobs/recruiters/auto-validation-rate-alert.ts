import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import type { IDetectionAlert, IDetectionMetrics } from "shared/models/detection-alerts.model"
import { DETECTION_ALERT_STATUS } from "shared/models/detection-alerts.model"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { z } from "zod"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import type { IDetectionEvaluation, IDetectionRule } from "@/jobs/detection/detection-rule"
import { DETECTION_GLOBAL_KEY } from "@/jobs/detection/detection-rule"
import { API_KEY_CREATION_REASON, AUTO_VALIDATION_INDETERMINATE_PREFIX } from "@/services/auto-validation-reasons"

const DAY_MS = 24 * 60 * 60 * 1000

type IRoleOutcome = "auto" | "refused" | "indeterminate" | "excluded"

// Regroupe les raisons d'auto-validation, anciennes et nouvelles (cf. auto-validation-reasons), en catégories lisibles dans l'alerte.
const AUTO_REASON_CATEGORIES: Array<{ pattern: RegExp; bal: boolean; toCategory: (match: RegExpMatchArray) => string }> = [
  { pattern: /^validation par : recruteurs LBA/, bal: false, toCategory: () => "recruteurs LBA" },
  { pattern: /^validaton par : bonnes boites ou referentiel opco/, bal: false, toCategory: () => "recruteurs LBA (ancienne raison)" },
  { pattern: /^validation par : BAL \(sources : ([^;]*) ;/, bal: true, toCategory: (match) => `BAL (${match[1]})` },
  { pattern: /^validaton par : BAL/, bal: true, toCategory: () => "BAL (ancienne raison)" },
  { pattern: /correspond(?: à celui d'un| à un) contact$/, bal: false, toCategory: () => "contact CFA" },
]

const categorizeAutoReason = (reason: string): { category: string; bal: boolean } => {
  for (const { pattern, bal, toCategory } of AUTO_REASON_CATEGORIES) {
    const match = reason.match(pattern)
    if (match) return { category: toCategory(match), bal }
  }
  return { category: `autre (${reason})`, bal: false }
}

/**
 * Issue de la validation automatique d'un rôle, lue dans son historique.
 * Un rôle créé par clé API ne passe par aucune validation : il est exclu du taux.
 */
export const classifyRole = (events: IRoleManagement["status"]): { outcome: IRoleOutcome; category: string; bal: boolean } => {
  const autoGrant = events.find((event) => event.status === AccessStatus.GRANTED && event.validation_type === VALIDATION_UTILISATEUR.AUTO)
  if (autoGrant?.reason === API_KEY_CREATION_REASON) {
    return { outcome: "excluded", category: "création par clé API", bal: false }
  }
  if (autoGrant) {
    return { outcome: "auto", ...categorizeAutoReason(autoGrant.reason) }
  }
  const indeterminate = events.find((event) => event.status === AccessStatus.AWAITING_VALIDATION && event.reason.startsWith(AUTO_VALIDATION_INDETERMINATE_PREFIX))
  if (indeterminate) {
    return { outcome: "indeterminate", category: `indéterminé (${indeterminate.reason.slice(AUTO_VALIDATION_INDETERMINATE_PREFIX.length)})`, bal: false }
  }
  return { outcome: "refused", category: "refus ou validation manuelle", bal: false }
}

export type IWindowStats = Record<IRoleOutcome, number> & {
  breakdown: Record<string, number>
  /** Rôles entreprise tranchés (auto ou refus) : dénominateur de la part BAL. */
  entrepriseDecided: number
  entrepriseBal: number
}

const emptyStats = (): IWindowStats => ({ auto: 0, refused: 0, indeterminate: 0, excluded: 0, breakdown: {}, entrepriseDecided: 0, entrepriseBal: 0 })

export const computeWindowStats = (roles: Pick<IRoleManagement, "status" | "authorized_type">[]): IWindowStats => {
  const stats = emptyStats()
  for (const role of roles) {
    const { outcome, category, bal } = classifyRole(role.status)
    stats[outcome]++
    stats.breakdown[category] = (stats.breakdown[category] ?? 0) + 1
    if (role.authorized_type === AccessEntityType.ENTREPRISE && (outcome === "auto" || outcome === "refused")) {
      stats.entrepriseDecided++
      if (bal) stats.entrepriseBal++
    }
  }
  return stats
}

/** Taux d'auto-validation hors indéterminés et hors clé API, `null` sans rôle tranché. */
export const autoValidationRate = (stats: IWindowStats): number | null => {
  const decided = stats.auto + stats.refused
  return decided ? stats.auto / decided : null
}

/** Part des rôles entreprise tranchés validés par BAL, `null` sans rôle entreprise tranché. */
export const balShare = (stats: IWindowStats): number | null => (stats.entrepriseDecided ? stats.entrepriseBal / stats.entrepriseDecided : null)

// Tolérance de virgule flottante : 0,3 × 0,34 vaut 0,10200000000000001, une part de 10,2 % est pourtant pile au seuil.
const isBelow = (value: number, threshold: number) => value < threshold - 1e-9

/**
 * Chute de la part BAL (#5742) : les trois incidents connus de 2024-2026 sont des pannes de BAL, qui répond sans erreur
 * mais ne valide plus. Pendant une alerte, la référence reste celle de l'entrée, sinon une panne plus longue que la
 * fenêtre de référence finirait par devenir la norme ; et sans volume suffisant, l'alerte reste ouverte.
 */
export const evaluateBalShare = (
  recent: IWindowStats,
  baseline: IWindowStats,
  { minVolume, dropRatio }: { minVolume: number; dropRatio: number },
  openingReference: number | null
) => {
  const recentShare = balShare(recent)
  const baselineShare = balShare(baseline)
  const referenceShare = openingReference ?? baselineShare
  const enoughVolume = recent.entrepriseDecided >= minVolume
  const belowThreshold = recentShare !== null && referenceShare !== null && referenceShare > 0 && isBelow(recentShare, dropRatio * referenceShare)
  const alert = openingReference === null ? enoughVolume && belowThreshold : belowThreshold || !enoughVolume
  return { recentShare, baselineShare, referenceShare, alert }
}

export const evaluateRateDrop = (recent: IWindowStats, baseline: IWindowStats, { minVolume, dropThresholdPoints }: { minVolume: number; dropThresholdPoints: number }) => {
  const recentRate = autoValidationRate(recent)
  const baselineRate = autoValidationRate(baseline)
  const enoughVolume = recent.auto + recent.refused >= minVolume && baseline.auto + baseline.refused >= minVolume
  // Arrondi au centième de point : une différence de taux en virgule flottante tombe sinon juste sous le seuil.
  const dropPoints = recentRate !== null && baselineRate !== null ? Math.round((baselineRate - recentRate) * 10_000) / 100 : null
  return { recentRate, baselineRate, dropPoints, alert: enoughVolume && dropPoints !== null && dropPoints >= dropThresholdPoints }
}

export const evaluateIndeterminateSpike = (recent: IWindowStats, { minVolume, thresholdPercent }: { minVolume: number; thresholdPercent: number }) => {
  const evaluated = recent.auto + recent.refused + recent.indeterminate
  const share = evaluated ? recent.indeterminate / evaluated : 0
  return { share, alert: evaluated >= minVolume && share * 100 >= thresholdPercent }
}

// Filtre servi par l'index { authorized_type, createdAt } de rolemanagements.
export const getRolesWindowFilter = (from: Date, to: Date) => ({
  authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] },
  createdAt: { $gte: from, $lt: to },
})

const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

/** Fenêtres arrêtées à minuit UTC du jour évalué : la récente va de J-`recentDays` à J-1, la référence couvre les `baselineDays` jours d'avant. */
const loadWindows = async (now: Date, recentDays: number, baselineDays: number) => {
  const asOf = startOfUtcDay(now)
  const recentStart = new Date(asOf.getTime() - recentDays * DAY_MS)
  const baselineStart = new Date(recentStart.getTime() - baselineDays * DAY_MS)
  const roles = await getDbCollection("rolemanagements")
    .find(getRolesWindowFilter(baselineStart, asOf), { projection: { status: 1, createdAt: 1, authorized_type: 1 } })
    .toArray()
  return {
    asOf: asOf.toISOString().slice(0, 10),
    recent: computeWindowStats(roles.filter((role) => role.createdAt >= recentStart)),
    baseline: computeWindowStats(roles.filter((role) => role.createdAt < recentStart)),
  }
}

const roundRatio = (value: number | null) => (value === null ? null : Math.round(value * 1000) / 1000)

const formatPercent = (value: number | null) => (value === null ? "n/a" : `${Math.round(value * 100)} %`)

const formatBreakdown = (breakdown: Record<string, number>) =>
  Object.entries(breakdown)
    .sort(([categoryA, countA], [categoryB, countB]) => countB - countA || categoryA.localeCompare(categoryB))
    .map(([category, count]) => `${category} ${count}`)
    .join(" · ")

const adminLinks = () => [{ label: "back-office des comptes", url: `${config.publicUrl}/espace-pro/administration/users` }]

// Uniquement des comptes et des catégories de raison : aucune donnée de compte dans l'alerte.
const evaluation = (alert: boolean, observations: IDetectionMetrics, summary: string): IDetectionEvaluation => ({
  observations,
  findings: alert ? [{ key: DETECTION_GLOBAL_KEY, metrics: observations, summary, links: adminLinks() }] : [],
})

// 7 h à Paris l'été, 6 h l'hiver : les fenêtres s'arrêtent de toute façon à minuit UTC.
const DAILY_AT_5_UTC = { everyMinutes: 24 * 60, offsetMinutes: 5 * 60 }
const WEEKLY_REMINDER_HOURS = 7 * 24

const recentDays = z.number().int().positive().default(7)
const baselineDays = z.number().int().positive().default(28)

const balShareThresholds = z.strictObject({
  recentDays,
  baselineDays,
  minVolume: z.number().int().positive().default(50).describe("Rôles entreprise tranchés sur la fenêtre récente"),
  dropRatio: z.number().gt(0).lte(1).default(0.5).describe("Alerte quand la part BAL tombe sous cette fraction de la référence"),
})

const openingReferenceShare = (activeAlerts: IDetectionAlert[]) => {
  const value = activeAlerts.find(({ status }) => status === DETECTION_ALERT_STATUS.OUVERTE)?.opening_metrics?.reference_share
  return typeof value === "number" ? value : null
}

export const autoValidationBalShareRule: IDetectionRule<z.output<typeof balShareThresholds>> = {
  id: "auto_validation_part_bal",
  title: "Part BAL des validations automatiques",
  severity: "haute",
  periodicity: DAILY_AT_5_UTC,
  enabledByDefault: true,
  thresholds: balShareThresholds,
  confirmations: 1,
  reminderEveryHours: WEEKLY_REMINDER_HOURS,
  evaluate: async ({ now, thresholds, activeAlerts }) => {
    const { asOf, recent, baseline } = await loadWindows(now, thresholds.recentDays, thresholds.baselineDays)
    const openingReference = openingReferenceShare(activeAlerts)
    const { recentShare, baselineShare, referenceShare, alert } = evaluateBalShare(recent, baseline, thresholds, openingReference)
    const threshold = referenceShare === null ? null : thresholds.dropRatio * referenceShare
    const thresholdText =
      openingReference === null
        ? `Seuil d'alerte : ${formatPercent(threshold)}.`
        : `Seuil d'alerte : ${formatPercent(threshold)}, calculé sur la part d'avant l'incident (${formatPercent(referenceShare)}).`
    return evaluation(
      alert,
      {
        as_of: asOf,
        recent_entreprise_decided: recent.entrepriseDecided,
        recent_bal: recent.entrepriseBal,
        baseline_entreprise_decided: baseline.entrepriseDecided,
        baseline_bal: baseline.entrepriseBal,
        recent_share: roundRatio(recentShare),
        baseline_share: roundRatio(baselineShare),
        reference_share: roundRatio(referenceShare),
        repartition: formatBreakdown(recent.breakdown),
      },
      [
        `Part des rôles entreprise tranchés validés par BAL : ${formatPercent(recentShare)} sur les ${thresholds.recentDays} derniers jours (${recent.entrepriseBal} sur ${recent.entrepriseDecided}), contre ${formatPercent(baselineShare)} sur les ${thresholds.baselineDays} jours précédents (${baseline.entrepriseBal} sur ${baseline.entrepriseDecided}). ${thresholdText}`,
        `Répartition sur ${thresholds.recentDays} jours : ${formatBreakdown(recent.breakdown)}`,
      ].join("\n")
    )
  },
}

const rateDropThresholds = z.strictObject({
  recentDays,
  baselineDays,
  minVolume: z.number().int().positive().default(30).describe("Rôles tranchés (auto ou refus) dans chaque fenêtre"),
  dropThresholdPoints: z.number().positive().default(10),
})

/** Filet de sécurité de la part BAL : deux constats consécutifs écartent une partie des creux saisonniers (#5742). */
export const autoValidationRateDropRule: IDetectionRule<z.output<typeof rateDropThresholds>> = {
  id: "auto_validation_taux_global",
  title: "Taux d'auto-validation des comptes",
  severity: "moyenne",
  periodicity: DAILY_AT_5_UTC,
  enabledByDefault: true,
  thresholds: rateDropThresholds,
  confirmations: 2,
  reminderEveryHours: WEEKLY_REMINDER_HOURS,
  evaluate: async ({ now, thresholds }) => {
    const { asOf, recent, baseline } = await loadWindows(now, thresholds.recentDays, thresholds.baselineDays)
    const { recentRate, baselineRate, dropPoints, alert } = evaluateRateDrop(recent, baseline, thresholds)
    return evaluation(
      alert,
      {
        as_of: asOf,
        recent_auto: recent.auto,
        recent_refused: recent.refused,
        recent_indeterminate: recent.indeterminate,
        recent_excluded: recent.excluded,
        baseline_auto: baseline.auto,
        baseline_refused: baseline.refused,
        recent_rate: roundRatio(recentRate),
        baseline_rate: roundRatio(baselineRate),
        drop_points: dropPoints,
        repartition: formatBreakdown(recent.breakdown),
      },
      [
        `Taux d'auto-validation des comptes entreprise et CFA : ${formatPercent(recentRate)} sur les ${thresholds.recentDays} derniers jours (${recent.auto + recent.refused} rôles), contre ${formatPercent(baselineRate)} sur les ${thresholds.baselineDays} jours précédents (${baseline.auto + baseline.refused} rôles), soit ${Math.round(dropPoints ?? 0)} points de moins.`,
        `Répartition sur ${thresholds.recentDays} jours : ${formatBreakdown(recent.breakdown)}`,
      ].join("\n")
    )
  },
}

const indeterminateThresholds = z.strictObject({
  recentDays,
  minVolume: z.number().int().positive().default(30).describe("Rôles évalués (auto, refus ou indéterminé) sur la fenêtre récente"),
  thresholdPercent: z.number().positive().default(5),
})

/** Indisponibilité de BAL ou d'un fournisseur (#5409, #5411), hors taux d'auto-validation. */
export const autoValidationIndeterminateRule: IDetectionRule<z.output<typeof indeterminateThresholds>> = {
  id: "auto_validation_indetermines",
  title: "Validations automatiques indéterminées",
  severity: "technique",
  periodicity: DAILY_AT_5_UTC,
  enabledByDefault: true,
  thresholds: indeterminateThresholds,
  confirmations: 1,
  reminderEveryHours: WEEKLY_REMINDER_HOURS,
  evaluate: async ({ now, thresholds }) => {
    const { asOf, recent } = await loadWindows(now, thresholds.recentDays, 0)
    const { share, alert } = evaluateIndeterminateSpike(recent, thresholds)
    return evaluation(
      alert,
      {
        as_of: asOf,
        recent_evaluated: recent.auto + recent.refused + recent.indeterminate,
        recent_indeterminate: recent.indeterminate,
        indeterminate_share: roundRatio(share),
        repartition: formatBreakdown(recent.breakdown),
      },
      [
        `Validations automatiques indéterminées : ${formatPercent(share)} sur les ${thresholds.recentDays} derniers jours (${recent.indeterminate} rôles). Incident fournisseur probable, hors taux d'auto-validation.`,
        `Répartition sur ${thresholds.recentDays} jours : ${formatBreakdown(recent.breakdown)}`,
      ].join("\n")
    )
  },
}

export const autoValidationRules = [autoValidationBalShareRule, autoValidationRateDropRule, autoValidationIndeterminateRule]
