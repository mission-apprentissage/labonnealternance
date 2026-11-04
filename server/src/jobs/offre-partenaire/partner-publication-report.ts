import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { formatSlackTable } from "@/common/utils/slack-utils"
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

const getAlert = ({ received, validated, businessErrors, active }: PartnerPublicationStats): string | null => {
  const eligible = received - Object.values(businessErrors).reduce((sum, count) => sum + count, 0)
  if (received === 0) return `aucune offre reçue, ${active} encore actives`
  if (active === 0) return "0 offre publiée"
  if (eligible > 0 && validated / eligible < MIN_PUBLICATION_RATE) return `taux de publication sous ${Math.round(MIN_PUBLICATION_RATE * 100)} %`
  return null
}

const PUBLICATION_TABLE_HEADER = ["Partenaire", "Reçues", "B.err", "Valid.", "Taux", "E.val", "Actives", "Motif principal"]
const PUBLICATION_TABLE_ALIGN_RIGHT = [false, true, true, true, true, true, true, false]

const PUBLICATION_TABLE_LEGEND = "B.err = business_error, E.val = erreur de validation, Taux = Valid. / (Reçues − B.err)"

const getBlockedBreakdown = (businessErrors: PartnerPublicationStats["businessErrors"]) => {
  const blocked = Object.entries(businessErrors).sort(([reasonA, a], [reasonB, b]) => b - a || reasonA.localeCompare(reasonB))
  return { blocked, blockedCount: blocked.reduce((sum, [, count]) => sum + count, 0) }
}

// Offres ni validées, ni en erreur de validation, ni en business_error : le traitement de nuit ne les a pas tranchées.
const getPendingCount = ({ received, validated, businessErrors, validationErrors }: PartnerPublicationStats) =>
  received - getBlockedBreakdown(businessErrors).blockedCount - validated - validationErrors

const toPublicationRow = ({ partner_label, received, validated, businessErrors, validationErrors, active }: PartnerPublicationStats, alert: string | null): string[] => {
  const { blocked, blockedCount } = getBlockedBreakdown(businessErrors)
  const eligible = received - blockedCount
  const rate = eligible > 0 ? `${Math.round((validated / eligible) * 100)}%` : "n/a"
  const [mainReason, ...otherReasons] = blocked
  const otherReasonsSuffix = otherReasons.length ? ` (+${otherReasons.length} motif${otherReasons.length > 1 ? "s" : ""})` : ""
  return [
    `${alert ? "! " : ""}${partner_label}`,
    String(received),
    String(blockedCount),
    String(validated),
    rate,
    String(validationErrors),
    String(active),
    mainReason ? `${mainReason[0]} ${mainReason[1]}${otherReasonsSuffix}` : "",
  ]
}

export const formatPartnerPublicationReport = (stats: PartnerPublicationStats[]): string[] => {
  const rows = stats.map((partnerStats) => ({ partnerStats, alert: getAlert(partnerStats) }))
  rows.sort((a, b) => Number(Boolean(b.alert)) - Number(Boolean(a.alert)) || a.partnerStats.partner_label.localeCompare(b.partnerStats.partner_label))
  const alerts = rows.filter(({ alert }) => alert)
  const pendingLines = rows.flatMap(({ partnerStats }) => {
    const pending = getPendingCount(partnerStats)
    return pending > 0 ? [`• ${partnerStats.partner_label} : ${pending} sans verdict de validation`] : []
  })
  return [
    "",
    `Taux de publication par partenaire flux${alerts.length ? ` (${alerts.length} à surveiller)` : ""} :`,
    ...formatSlackTable(
      PUBLICATION_TABLE_HEADER,
      rows.map(({ partnerStats, alert }) => toPublicationRow(partnerStats, alert)),
      { alignRight: PUBLICATION_TABLE_ALIGN_RIGHT }
    ),
    PUBLICATION_TABLE_LEGEND,
    ...alerts.map(({ partnerStats, alert }) => `• ALERTE ${partnerStats.partner_label} : ${alert}`),
    ...pendingLines,
  ]
}

/** Section du bilan quotidien. Une panne de la mesure ne doit pas empêcher l'envoi du bilan : elle y est signalée. */
export const buildPartnerPublicationReport = async (expectedPartnerLabels?: string[]): Promise<string[]> => {
  try {
    return formatPartnerPublicationReport(await getPartnerPublicationStats(expectedPartnerLabels))
  } catch (err) {
    logger.error({ err }, "buildPartnerPublicationReport: mesure du taux de publication en échec")
    sentryCaptureException(err)
    return ["", `• ALERTE taux de publication par partenaire indisponible : ${err instanceof Error ? err.message : String(err)}`]
  }
}
