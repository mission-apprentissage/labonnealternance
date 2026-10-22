import { ObjectId } from "mongodb"
import type { IDetectionQualificationVerdict } from "shared/models/detection-alerts.model"
import { DETECTION_ALERT_ACTIVE_STATUSES, DETECTION_ALERT_STATUS, DETECTION_QUALIFICATION_VERDICTS } from "shared/models/detection-alerts.model"
import type { IDetectionRuleState } from "shared/models/detection-rules.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { resolveRuleSettings } from "./detection-engine"
import { replayDetectionRule } from "./detection-replay"
import type { IDetectionRule } from "./detection-rule"
import { detectionRules } from "./detection-rules"

const findRule = (ruleId: string | undefined, rules: IDetectionRule[]): IDetectionRule => {
  const rule = rules.find(({ id }) => id === ruleId)
  if (!rule) {
    throw new Error(`règle de détection inconnue : ${ruleId} (règles : ${rules.map(({ id }) => id).join(", ") || "aucune"})`)
  }
  return rule
}

const describeSettings = (rule: IDetectionRule, state: IDetectionRuleState | null) => {
  try {
    return resolveRuleSettings(rule, state)
  } catch {
    return { enabled: state?.enabled ?? rule.enabledByDefault, thresholds: "surcharge invalide, la règle échouera" }
  }
}

/** Réglages effectifs de chaque règle, avec leur origine et les épisodes en cours. */
export const listDetectionRules = async ({ rules = detectionRules }: { rules?: IDetectionRule[] } = {}) => {
  const states = await getDbCollection("detection_rules").find({}).toArray()
  const activeCounts = await getDbCollection("detection_alerts")
    .aggregate<{ _id: { rule_id: string; status: string }; count: number }>([
      { $match: { status: { $in: [...DETECTION_ALERT_ACTIVE_STATUSES] } } },
      { $group: { _id: { rule_id: "$rule_id", status: "$status" }, count: { $sum: 1 } } },
    ])
    .toArray()
  const report = rules.map((rule) => {
    const state = states.find(({ rule_id }) => rule_id === rule.id) ?? null
    const countOf = (status: string) => activeCounts.find(({ _id }) => _id.rule_id === rule.id && _id.status === status)?.count ?? 0
    return {
      rule: rule.id,
      title: rule.title,
      severity: rule.severity,
      periodicity: rule.periodicity,
      ...describeSettings(rule, state),
      overrides: { enabled: state?.enabled ?? null, thresholds: state?.thresholds ?? null, updated_at: state?.updated_at ?? null },
      last_slot_at: state?.last_slot_at ?? null,
      alerts: { ouvertes: countOf(DETECTION_ALERT_STATUS.OUVERTE), en_attente: countOf(DETECTION_ALERT_STATUS.EN_ATTENTE) },
    }
  })
  logger.info({ webhook: config.detectionSlackWebhook ? "dédié" : "jobs (repli)", rules: report }, "règles de détection")
  return report
}

const parseEnabled = (value: string) => {
  if (value !== "true" && value !== "false") {
    throw new Error(`--enabled attend true ou false, reçu ${value}`)
  }
  return value === "true"
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const parseThresholds = (value: string, example = `'{"minVolume":50}'`): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(value)
  if (!isPlainObject(parsed)) {
    throw new Error(`--thresholds attend un objet JSON, ex. ${example}`)
  }
  return parsed
}

/**
 * Règle l'activation et les seuils d'une règle sans redéploiement : pris en compte à l'exécution suivante du cron.
 * Les seuils fournis complètent la surcharge existante ; `--reset` revient aux valeurs du code.
 */
export const configureDetectionRule = async ({
  rule: ruleId,
  enabled,
  thresholds,
  reset = false,
  rules = detectionRules,
}: {
  rule?: string
  enabled?: string
  thresholds?: string
  reset?: boolean
  rules?: IDetectionRule[]
}) => {
  const rule = findRule(ruleId, rules)
  if (enabled === undefined && thresholds === undefined && !reset) {
    throw new Error("rien à régler : --enabled, --thresholds ou --reset")
  }
  const current = await getDbCollection("detection_rules").findOne({ rule_id: rule.id })
  const settings: Partial<Pick<IDetectionRuleState, "enabled" | "thresholds">> = reset ? { enabled: null, thresholds: null } : {}
  if (enabled !== undefined) {
    settings.enabled = parseEnabled(enabled)
  }
  if (thresholds !== undefined) {
    const override = { ...(reset ? {} : (current?.thresholds ?? {})), ...parseThresholds(thresholds) }
    // Validée avant l'écriture : une surcharge refusée par le schéma ferait échouer la règle à chaque exécution.
    rule.thresholds.parse(override)
    settings.thresholds = override as IDetectionRuleState["thresholds"]
  }
  const defaults = { enabled: null, thresholds: null, last_slot_at: null }
  const setOnInsert = Object.fromEntries(Object.entries(defaults).filter(([field]) => !(field in settings)))
  await getDbCollection("detection_rules").updateOne({ rule_id: rule.id }, { $set: { ...settings, updated_at: new Date() }, $setOnInsert: setOnInsert }, { upsert: true })
  const [updated] = await listDetectionRules({ rules: [rule] })
  return updated
}

/** Qualifie un épisode notifié, pour mesurer le taux de faux positifs de chaque règle. */
export const qualifyDetectionAlert = async ({ id, verdict }: { id?: string; verdict?: string }) => {
  if (!id || !ObjectId.isValid(id)) {
    throw new Error(`--id attend l'identifiant d'une alerte, reçu ${id}`)
  }
  const verdicts: string[] = Object.values(DETECTION_QUALIFICATION_VERDICTS)
  if (!verdict || !verdicts.includes(verdict)) {
    throw new Error(`--verdict attend ${verdicts.join(" ou ")}, reçu ${verdict}`)
  }
  const { matchedCount } = await getDbCollection("detection_alerts").updateOne(
    { _id: new ObjectId(id), status: { $ne: DETECTION_ALERT_STATUS.EN_ATTENTE } },
    { $set: { qualification: { verdict: verdict as IDetectionQualificationVerdict, at: new Date() } } }
  )
  if (!matchedCount) {
    throw new Error(`alerte introuvable ou jamais notifiée : ${id}`)
  }
  logger.info({ id, verdict }, "alerte de détection qualifiée")
}

const DAY_MS = 24 * 60 * 60 * 1000

const parseDay = (value: string | undefined, option: string): Date => {
  const date = new Date(value ?? "")
  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(`${option} attend une date ISO (ex. 2025-05-01)`)
  }
  return date
}

/**
 * Rejoue les règles sur une période passée, `--to` inclus, sans rien écrire ni notifier : une ligne par créneau avec les
 * mesures de la règle et les notifications qui seraient parties, puis les épisodes. Seuils en vigueur, ou ceux de `--thresholds`.
 */
export const replayDetectionRules = async ({
  from,
  to,
  rule: ruleId,
  thresholds,
  rules = detectionRules,
}: {
  from?: string
  to?: string
  rule?: string
  thresholds?: string
  rules?: IDetectionRule[]
}) => {
  const start = parseDay(from, "--from")
  const end = new Date(parseDay(to, "--to").getTime() + DAY_MS)
  const selected = ruleId ? [findRule(ruleId, rules)] : rules
  const overrides = thresholds ? parseThresholds(thresholds, `'{"auto_validation_part_bal":{"dropRatio":0.4}}'`) : {}
  for (const [overrideRuleId, override] of Object.entries(overrides)) {
    findRule(overrideRuleId, selected)
    if (!isPlainObject(override)) {
      throw new Error(`--thresholds : les seuils de ${overrideRuleId} doivent former un objet JSON`)
    }
  }
  const states = await getDbCollection("detection_rules")
    .find({ rule_id: { $in: selected.map(({ id }) => id) } })
    .toArray()
  const results: Array<{ rule: string } & Awaited<ReturnType<typeof replayDetectionRule>>> = []
  for (const rule of selected) {
    const state = states.find(({ rule_id }) => rule_id === rule.id)
    const effective = rule.thresholds.parse({ ...(state?.thresholds ?? {}), ...(overrides[rule.id] as Record<string, unknown> | undefined) })
    const replay = await replayDetectionRule({ rule, from: start, to: end, thresholds: effective })
    replay.lines.forEach((line) => logger.info({ rule: rule.id, ...line }, "rejeu d'une règle de détection"))
    logger.info({ rule: rule.id, thresholds: effective, episodes: replay.episodes }, "épisodes du rejeu d'une règle de détection")
    results.push({ rule: rule.id, ...replay })
  }
  return results
}
