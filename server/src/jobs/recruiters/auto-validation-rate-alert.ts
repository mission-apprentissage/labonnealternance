import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"
import { API_KEY_CREATION_REASON, AUTO_VALIDATION_INDETERMINATE_PREFIX } from "@/services/auto-validation-reasons"

const DAY_MS = 24 * 60 * 60 * 1000

type IRoleOutcome = "auto" | "refused" | "indeterminate" | "excluded"

// Regroupe les raisons d'auto-validation, anciennes et nouvelles (cf. auto-validation-reasons), en catégories lisibles dans l'alerte.
const AUTO_REASON_CATEGORIES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^validation par : recruteurs LBA/, () => "recruteurs LBA"],
  [/^validaton par : bonnes boites ou referentiel opco/, () => "recruteurs LBA (ancienne raison)"],
  [/^validation par : BAL \(sources : ([^;]*) ;/, (match) => `BAL (${match[1]})`],
  [/^validaton par : BAL/, () => "BAL (ancienne raison)"],
  [/correspond(?: à celui d'un| à un) contact$/, () => "contact CFA"],
]

const categorizeAutoReason = (reason: string): string => {
  for (const [pattern, toCategory] of AUTO_REASON_CATEGORIES) {
    const match = reason.match(pattern)
    if (match) return toCategory(match)
  }
  return `autre (${reason})`
}

/**
 * Issue de la validation automatique d'un rôle, lue dans son historique.
 * Un rôle créé par clé API ne passe par aucune validation : il est exclu du taux.
 */
export const classifyRole = (events: IRoleManagement["status"]): { outcome: IRoleOutcome; category: string } => {
  const autoGrant = events.find((event) => event.status === AccessStatus.GRANTED && event.validation_type === VALIDATION_UTILISATEUR.AUTO)
  if (autoGrant?.reason === API_KEY_CREATION_REASON) {
    return { outcome: "excluded", category: "création par clé API" }
  }
  if (autoGrant) {
    return { outcome: "auto", category: categorizeAutoReason(autoGrant.reason) }
  }
  const indeterminate = events.find((event) => event.status === AccessStatus.AWAITING_VALIDATION && event.reason.startsWith(AUTO_VALIDATION_INDETERMINATE_PREFIX))
  if (indeterminate) {
    return { outcome: "indeterminate", category: `indéterminé (${indeterminate.reason.slice(AUTO_VALIDATION_INDETERMINATE_PREFIX.length)})` }
  }
  return { outcome: "refused", category: "refus ou validation manuelle" }
}

export type IWindowStats = Record<IRoleOutcome, number> & { breakdown: Record<string, number> }

const emptyStats = (): IWindowStats => ({ auto: 0, refused: 0, indeterminate: 0, excluded: 0, breakdown: {} })

export const computeWindowStats = (roles: Pick<IRoleManagement, "status">[]): IWindowStats => {
  const stats = emptyStats()
  for (const role of roles) {
    const { outcome, category } = classifyRole(role.status)
    stats[outcome]++
    stats.breakdown[category] = (stats.breakdown[category] ?? 0) + 1
  }
  return stats
}

/** Taux d'auto-validation hors indéterminés et hors clé API, `null` sans rôle tranché. */
export const autoValidationRate = (stats: IWindowStats): number | null => {
  const decided = stats.auto + stats.refused
  return decided ? stats.auto / decided : null
}

type IThresholds = Pick<typeof config.autoValidationAlert, "minVolume" | "dropThresholdPoints" | "indeterminateThresholdPercent">

export const evaluateAutoValidation = (recent: IWindowStats, baseline: IWindowStats, thresholds: IThresholds) => {
  const recentRate = autoValidationRate(recent)
  const baselineRate = autoValidationRate(baseline)
  const enoughVolume = recent.auto + recent.refused >= thresholds.minVolume && baseline.auto + baseline.refused >= thresholds.minVolume
  // Arrondi au centième de point : une différence de taux en virgule flottante tombe sinon juste sous le seuil.
  const dropPoints = recentRate !== null && baselineRate !== null ? Math.round((baselineRate - recentRate) * 10_000) / 100 : null
  const rateDrop = enoughVolume && dropPoints !== null && dropPoints >= thresholds.dropThresholdPoints

  const evaluated = recent.auto + recent.refused + recent.indeterminate
  const indeterminateShare = evaluated ? recent.indeterminate / evaluated : 0
  const indeterminateSpike = evaluated >= thresholds.minVolume && indeterminateShare * 100 >= thresholds.indeterminateThresholdPercent

  return { recentRate, baselineRate, dropPoints, indeterminateShare, rateDrop, indeterminateSpike }
}

// Filtre servi par l'index { authorized_type, createdAt } de rolemanagements.
export const getRolesWindowFilter = (from: Date, to: Date) => ({
  authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] },
  createdAt: { $gte: from, $lt: to },
})

const computeWindowsAt = async (asOf: Date) => {
  const { recentDays, baselineDays } = config.autoValidationAlert
  const recentStart = new Date(asOf.getTime() - recentDays * DAY_MS)
  const baselineStart = new Date(recentStart.getTime() - baselineDays * DAY_MS)
  const roles = await getDbCollection("rolemanagements")
    .find(getRolesWindowFilter(baselineStart, asOf), { projection: { status: 1, createdAt: 1 } })
    .toArray()
  const recent = computeWindowStats(roles.filter((role) => role.createdAt >= recentStart))
  const baseline = computeWindowStats(roles.filter((role) => role.createdAt < recentStart))
  return { recent, baseline, evaluation: evaluateAutoValidation(recent, baseline, config.autoValidationAlert) }
}

const formatPercent = (value: number | null) => (value === null ? "n/a" : `${Math.round(value * 100)} %`)

const formatBreakdown = (breakdown: Record<string, number>) =>
  Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => `${category} ${count}`)
    .join(" · ")

// Uniquement des comptes et des catégories de raison : aucune donnée de compte dans l'alerte.
export const formatAutoValidationAlert = ({ recent, baseline, evaluation }: Awaited<ReturnType<typeof computeWindowsAt>>) => {
  const { recentDays, baselineDays } = config.autoValidationAlert
  const lines: string[] = []
  if (evaluation.rateDrop) {
    lines.push(
      `Taux d'auto-validation des comptes entreprise et CFA : ${formatPercent(evaluation.recentRate)} sur les ${recentDays} derniers jours (${recent.auto + recent.refused} rôles), contre ${formatPercent(evaluation.baselineRate)} sur les ${baselineDays} jours précédents (${baseline.auto + baseline.refused} rôles), soit ${Math.round(evaluation.dropPoints ?? 0)} points de moins.`
    )
  }
  if (evaluation.indeterminateSpike) {
    lines.push(
      `Validations automatiques indéterminées : ${formatPercent(evaluation.indeterminateShare)} sur les ${recentDays} derniers jours (${recent.indeterminate} rôles). Incident fournisseur probable, hors taux d'auto-validation.`
    )
  }
  lines.push(`Répartition sur ${recentDays} jours : ${formatBreakdown(recent.breakdown)}`)
  return lines.join("\n")
}

export const autoValidationRateAlert = async ({ asOf = new Date() }: { asOf?: Date } = {}) => {
  const windows = await computeWindowsAt(asOf)
  const { recent, baseline, evaluation } = windows
  logger.info({ recent, baseline, evaluation }, "taux d'auto-validation des comptes")
  if (evaluation.rateDrop || evaluation.indeterminateSpike) {
    await notifyToSlack({ subject: "VALIDATION DES COMPTES", message: formatAutoValidationAlert(windows), error: true })
  }
  return windows
}

const parseDay = (value: string | undefined, option: string): Date => {
  const date = new Date(value ?? "")
  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(`${option} attend une date ISO (ex. 2025-05-01)`)
  }
  return date
}

/**
 * Rejoue l'évaluation jour par jour sur une période passée, sans notifier : vérifie a posteriori ce qui aurait déclenché.
 */
export const replayAutoValidationRateAlert = async ({ from, to }: { from?: string; to?: string } = {}) => {
  const start = parseDay(from, "--from")
  const end = parseDay(to, "--to")
  const days: Array<{ date: string } & ReturnType<typeof evaluateAutoValidation>> = []
  for (let asOf = start; asOf <= end; asOf = new Date(asOf.getTime() + DAY_MS)) {
    const { evaluation } = await computeWindowsAt(asOf)
    const day = { date: asOf.toISOString().slice(0, 10), ...evaluation }
    days.push(day)
    logger.info(day, "rejeu du taux d'auto-validation des comptes")
  }
  return days
}
