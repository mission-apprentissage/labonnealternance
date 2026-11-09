import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { formatSlackTable } from "@/common/utils/slack-utils"
import type { FluxCadence } from "./flux-cadence-digest"
import { getFluxCadenceByPartner } from "./flux-cadence-digest"
import { jobPartnersByFlux } from "./process-job-partners"

/** Seuil d'alerte à confirmer (#5671). */
export const MIN_PUBLICATION_RATE = 0.5

/**
 * Partenaires attendus chaque nuit, par cron d'import : un partenaire sans aucun document doit quand même
 * figurer au bilan. Liste explicite plutôt que lecture de `importers` (import circulaire via le digest, et
 * le nom du cron ne donne pas le partner_label) ; sa cohérence avec `importers` est vérifiée par un test.
 */
export const IMPORTED_FLUX_PARTNER_LABELS: Record<string, JOBPARTNERS_LABEL[]> = {
  "Import RHAlternance": [JOBPARTNERS_LABEL.RH_ALTERNANCE],
  "Import Hellowork": [JOBPARTNERS_LABEL.HELLOWORK, JOBPARTNERS_LABEL.HELLOWORK_BUDDI],
  "Import France Travail": [JOBPARTNERS_LABEL.FRANCE_TRAVAIL],
  "Import France Travail CEGID": [JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID],
  "Import Meteojob": [JOBPARTNERS_LABEL.METEOJOB],
  "Import Kelio": [JOBPARTNERS_LABEL.KELIO],
  "Import La Poste": [JOBPARTNERS_LABEL.LAPOSTE],
  "Import Le bon coin emploi": [JOBPARTNERS_LABEL.LEBONCOIN],
  "Import Jobteaser": [JOBPARTNERS_LABEL.JOBTEASER],
  "Import PASS": [JOBPARTNERS_LABEL.PASS],
  "Import Atlas": [JOBPARTNERS_LABEL.ATLAS],
  "Import Vite un emploi": [JOBPARTNERS_LABEL.VITE_UN_EMPLOI],
  "Import Nos Talents Nos Emplois": [JOBPARTNERS_LABEL.NOS_TALENTS_NOS_EMPLOIS],
  "Import Toulouse Metropole": [JOBPARTNERS_LABEL.TOULOUSE_METROPOLE],
  "Import Decathlon": [JOBPARTNERS_LABEL.DECATHLON],
  "Import EDF": [JOBPARTNERS_LABEL.EDF],
  "Import Enedis": [JOBPARTNERS_LABEL.ENEDIS],
  "Import APEC": [JOBPARTNERS_LABEL.APEC],
  "Import LinkedIn": [JOBPARTNERS_LABEL.LINKEDIN],
  "Import Emploi Inclusion": [JOBPARTNERS_LABEL.EMPLOI_INCLUSION],
  "Import Etudiant": [JOBPARTNERS_LABEL.JOB_ETUDIANT],
}

const expectedFluxPartnerLabels = (): string[] => Object.values(IMPORTED_FLUX_PARTNER_LABELS).flat()

export type PartnerPublicationStats = {
  partner_label: string
  received: number
  validated: number
  businessErrors: Record<string, number>
  validationErrors: number
  active: number
}

type ComputedGroup = {
  _id: { partner_label: string; business_error: string | null }
  count: number
  validated: number
  validationErrors: number
}

export const getPartnerPublicationStats = async (expectedPartnerLabels: string[] = expectedFluxPartnerLabels()): Promise<PartnerPublicationStats[]> => {
  const computedGroups = await getDbCollection("computed_jobs_partners")
    .aggregate<ComputedGroup>([
      { $match: { partner_label: { $in: jobPartnersByFlux } } },
      {
        $group: {
          _id: { partner_label: "$partner_label", business_error: { $ifNull: ["$business_error", null] } },
          count: { $sum: 1 },
          validated: { $sum: { $cond: [{ $eq: ["$validated", true] }, 1, 0] } },
          validationErrors: { $sum: { $cond: [{ $in: [COMPUTED_ERROR_SOURCE.VALIDATION, { $ifNull: ["$errors.source", []] }] }, 1, 0] } },
        },
      },
    ])
    .toArray()
  const activeGroups = await getDbCollection("jobs_partners")
    .aggregate<{ _id: string; count: number }>([
      { $match: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, partner_label: { $in: jobPartnersByFlux } } },
      { $group: { _id: "$partner_label", count: { $sum: 1 } } },
    ])
    .toArray()

  const stats = new Map<string, PartnerPublicationStats>()
  const getStats = (partner_label: string) => {
    let partnerStats = stats.get(partner_label)
    if (!partnerStats) {
      partnerStats = { partner_label, received: 0, validated: 0, businessErrors: {}, validationErrors: 0, active: 0 }
      stats.set(partner_label, partnerStats)
    }
    return partnerStats
  }

  for (const partner_label of expectedPartnerLabels) {
    getStats(partner_label)
  }
  for (const { _id, count, validated, validationErrors } of computedGroups) {
    const partnerStats = getStats(_id.partner_label)
    partnerStats.received += count
    if (_id.business_error === null) {
      partnerStats.validated += validated
      partnerStats.validationErrors += validationErrors
    } else {
      partnerStats.businessErrors[_id.business_error] = count
    }
  }
  for (const { _id, count } of activeGroups) {
    getStats(_id).active = count
  }

  return [...stats.values()]
}

const getPublicationAlert = ({ received, validated, businessErrors, active }: PartnerPublicationStats): string | null => {
  const eligible = received - Object.values(businessErrors).reduce((sum, count) => sum + count, 0)
  if (received === 0) return `aucune reçue, ${active} actives`
  if (active === 0) return "0 publiée"
  if (eligible > 0 && validated / eligible < MIN_PUBLICATION_RATE) return `taux < ${Math.round(MIN_PUBLICATION_RATE * 100)} %`
  return null
}

export type PartnerNightlyContext = {
  /** Alertes des garde-fous déclenchés, par partner_label. */
  guardrailAlerts?: Map<string, string[]>
  cadence?: Map<string, FluxCadence>
}

const NIGHTLY_TABLE_HEADER = ["Partenaire", "Reçues", "B.err", "Valid.", "Taux", "E.val", "Actives", "Chgts", "Sautés", "Dernier", "Motif principal", "Alerte"]
const NIGHTLY_TABLE_ALIGN_RIGHT = [false, true, true, true, true, true, true, true, true, false, false, false]

const NIGHTLY_TABLE_LEGEND =
  "B.err = business_error · E.val = erreur de validation · Taux = Valid. / (Reçues − B.err) · Chgts = runs où le flux a changé / runs sur 24 h · GF = garde-fou déclenché · « sans verdict » = ni validée, ni bloquée, ni en erreur (information)"

export const REMOVAL_GUARDRAIL_ALERT_PREFIX = "GF absentes"

const formatParisDay = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit" })

const getBlockedBreakdown = (businessErrors: PartnerPublicationStats["businessErrors"]) => {
  const blocked = Object.entries(businessErrors).sort(([reasonA, a], [reasonB, b]) => b - a || reasonA.localeCompare(reasonB))
  return { blocked, blockedCount: blocked.reduce((sum, [, count]) => sum + count, 0) }
}

// Offres ni validées, ni en erreur de validation, ni en business_error : le traitement de nuit ne les a pas tranchées.
const getPendingCount = ({ received, validated, businessErrors, validationErrors }: PartnerPublicationStats) =>
  received - getBlockedBreakdown(businessErrors).blockedCount - validated - validationErrors

type NightlyRow = { stats: PartnerPublicationStats; guardrailAlerts: string[]; publicationAlert: string | null; cadence?: FluxCadence }

const toNightlyRow = ({ stats, guardrailAlerts, publicationAlert, cadence }: NightlyRow): string[] => {
  const { partner_label, received, validated, businessErrors, validationErrors, active } = stats
  const { blocked, blockedCount } = getBlockedBreakdown(businessErrors)
  const eligible = received - blockedCount
  const rate = eligible > 0 ? `${Math.round((validated / eligible) * 100)}%` : "n/a"
  const [mainReason, ...otherReasons] = blocked
  const pending = getPendingCount(stats)
  const alerts = [...guardrailAlerts, ...(publicationAlert ? [publicationAlert] : []), ...(pending > 0 ? [`${pending} sans verdict`] : [])]
  return [
    `${guardrailAlerts.length || publicationAlert ? "! " : ""}${partner_label}`,
    String(received),
    String(blockedCount),
    String(validated),
    rate,
    String(validationErrors),
    String(active),
    cadence ? `${cadence.changed}/${cadence.runs}` : "",
    cadence ? String(cadence.skipped) : "",
    cadence ? (cadence.changed_at ? formatParisDay.format(cadence.changed_at) : "jamais") : "",
    mainReason ? `${mainReason[0]} ${mainReason[1]}${otherReasons.length ? ` (+${otherReasons.length})` : ""}` : "",
    alerts.join(", "),
  ]
}

const severity = ({ guardrailAlerts, publicationAlert }: NightlyRow) => (guardrailAlerts.length ? 0 : publicationAlert ? 1 : 2)

/**
 * Tableau unique du bilan nocturne : une ligne par partenaire flux, qui réunit publication, cadence du flux et
 * garde-fous. Les partenaires à vérifier (préfixe « ! ») viennent en tête, garde-fous d'abord.
 */
export const formatPartnerNightlyTable = (stats: PartnerPublicationStats[], { guardrailAlerts = new Map(), cadence = new Map() }: PartnerNightlyContext = {}): string[] => {
  const statsByPartner = new Map(stats.map((partnerStats) => [partnerStats.partner_label, partnerStats]))
  // Un garde-fou déclenché doit apparaître même hors de la liste attendue ; un signal de cadence seul (import désactivé) non.
  for (const partner_label of guardrailAlerts.keys()) {
    if (!statsByPartner.has(partner_label)) {
      statsByPartner.set(partner_label, { partner_label, received: 0, validated: 0, businessErrors: {}, validationErrors: 0, active: 0 })
    }
  }
  const rows: NightlyRow[] = [...statsByPartner.values()].map((partnerStats) => ({
    stats: partnerStats,
    guardrailAlerts: guardrailAlerts.get(partnerStats.partner_label) ?? [],
    publicationAlert: getPublicationAlert(partnerStats),
    cadence: cadence.get(partnerStats.partner_label),
  }))
  rows.sort((a, b) => severity(a) - severity(b) || a.stats.partner_label.localeCompare(b.stats.partner_label))
  const toCheck = rows.filter((row) => severity(row) < 2).length
  const hasRemovalGuardrail = rows.some(({ guardrailAlerts: alerts }) => alerts.some((alert) => alert.startsWith(REMOVAL_GUARDRAIL_ALERT_PREFIX)))
  return [
    "",
    `Partenaires flux${toCheck ? ` (${toCheck} à vérifier)` : ""} :`,
    ...formatSlackTable(NIGHTLY_TABLE_HEADER, rows.map(toNightlyRow), { alignRight: NIGHTLY_TABLE_ALIGN_RIGHT }),
    NIGHTLY_TABLE_LEGEND,
    ...(hasRemovalGuardrail ? [`Après vérification d'un « ${REMOVAL_GUARDRAIL_ALERT_PREFIX} » : yarn cli forceCancelRemovedJobsPartners --partnerLabel "<Partenaire>"`] : []),
  ]
}

/**
 * Section du bilan quotidien. Une panne de la mesure ne doit pas empêcher l'envoi du bilan : elle y est signalée,
 * et les garde-fous déclenchés restent listés.
 */
export const buildPartnerNightlyTable = async (
  { since, guardrailAlerts = new Map() }: { since: Date; guardrailAlerts?: Map<string, string[]> },
  expectedPartnerLabels?: string[]
): Promise<string[]> => {
  try {
    const [stats, cadence] = await Promise.all([getPartnerPublicationStats(expectedPartnerLabels), getFluxCadenceByPartner(since)])
    return formatPartnerNightlyTable(stats, { guardrailAlerts, cadence })
  } catch (err) {
    logger.error({ err }, "buildPartnerNightlyTable: mesure par partenaire en échec")
    sentryCaptureException(err)
    return [
      "",
      `• ALERTE tableau par partenaire indisponible : ${err instanceof Error ? err.message : String(err)}`,
      ...[...guardrailAlerts].flatMap(([partner_label, alerts]) => alerts.map((alert) => `• ${partner_label} : ${alert}`)),
    ]
  }
}
