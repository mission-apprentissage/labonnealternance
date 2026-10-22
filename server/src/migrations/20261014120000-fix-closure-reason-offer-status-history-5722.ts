import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Libellés figés ici plutôt qu'importés de JOB_CLOSURE_ORIGIN : la migration doit cibler les valeurs
 * présentes en base, même si l'enum évolue.
 */
const ORIGIN = {
  MAIL_RECRUTEUR: "action du recruteur depuis un mail",
  ESPACE_PRO_RECRUTEUR: "clôture par le recruteur depuis l'espace pro",
  ESPACE_PRO_CFA: "clôture par le CFA délégataire depuis l'espace pro",
  ESPACE_PRO_OPCO: "clôture par l'OPCO depuis l'espace pro",
  ESPACE_PRO_ADMIN: "clôture par un administrateur depuis l'espace pro",
  ESPACE_PRO_INDETERMINE: "clôture depuis l'espace pro (acteur indéterminé)",
} as const

const MANUAL_CLOSURE_REASON = "Désactivation manuelle"
const ADMIN_CLOSURE_REASON = "Action admin"
const MAIL_CLOSURE_REASON = "Réponse recruteur par mail"
/** Écrits sous l'origine mail par provideOffre et les routes v2, qui ne touchent pas job_status_comment. */
const ONE_CLICK_MAIL_REASONS = ["offre déclarée pourvue par le recruteur", "offre annulée par le recruteur"]
/** `reason` d'une clôture humaine qui ne porte pas de motif de la modale. */
const NOT_A_MOTIF = [MANUAL_CLOSURE_REASON, ADMIN_CLOSURE_REASON, MAIL_CLOSURE_REASON, ...ONE_CLICK_MAIL_REASONS]

/**
 * Depuis #5479, closeOffreWithMotif écrit le motif de la modale dans `offer_status_history[].reason`
 * au lieu de l'origine de la clôture (issue #5722). Les volets 1 à 3 sauvent d'abord le motif dans
 * `job_status_comment`, puis réécrivent `reason`. Le volet 4 unifie le libellé des clôtures au seuil
 * de candidatures.
 *
 * `updated_at` n'est pas touché : les tableaux de bord datent les clôtures sur ce champ.
 */
export const up = async () => {
  // Volet 1 — clôtures depuis l'espace pro par tout acteur autre qu'un administrateur
  await requalifyClosures("volet 1", [ORIGIN.ESPACE_PRO_RECRUTEUR, ORIGIN.ESPACE_PRO_CFA, ORIGIN.ESPACE_PRO_OPCO, ORIGIN.ESPACE_PRO_INDETERMINE], MANUAL_CLOSURE_REASON)
  // Volet 2 — clôtures par un administrateur depuis l'espace pro
  await requalifyClosures("volet 2", [ORIGIN.ESPACE_PRO_ADMIN], ADMIN_CLOSURE_REASON)
  // Volet 3 — réponses du recruteur via le lien d'un mail. Seules les réponses qui changeaient le
  // statut ont été écrites : les autres sont perdues (cf. closeOffreWithMotif).
  await requalifyClosures("volet 3", [ORIGIN.MAIL_RECRUTEUR], MAIL_CLOSURE_REASON)
  // Volet 4 — clôtures au seuil de candidatures faites au dépôt
  await unifyApplicationThresholdReason()
}

/** Sauve le motif dans `job_status_comment`, puis remplace par `reason` le motif des entrées des origines données. */
const requalifyClosures = async (volet: string, origins: string[], reason: string) => {
  const faultyEntry = { granted_by: { $in: origins }, reason: { $nin: NOT_A_MOTIF } }
  const filter = { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status_history: { $elemMatch: faultyEntry } }

  const saved = await saveLastMotifInComment(filter)
  logger.info(`${volet} — job_status_comment corrigé sur ${saved.modifiedCount}/${saved.matchedCount} offres`)

  const { matchedCount, modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    filter,
    { $set: { "offer_status_history.$[entry].reason": reason } },
    { arrayFilters: [{ "entry.granted_by": { $in: origins }, "entry.reason": { $nin: NOT_A_MOTIF } }], bypassDocumentValidation: true }
  )
  logger.info(`${volet} — ${modifiedCount}/${matchedCount} offres requalifiées en "${reason}"`)
}

/**
 * Les clôtures au seuil faites au dépôt (granted_by « application.service ») prennent le libellé du cron, désormais seul libellé de cette règle (cf.
 * closeJobsOnApplicationThreshold). `granted_by` est conservé : il signale les offres fermées sans
 * mail au recruteur. Toutes les offres sont concernées, partenaires comprises.
 */
const unifyApplicationThresholdReason = async () => {
  const faultyEntry = { granted_by: "application.service", reason: "nombre maximum de candidatures atteint (80)" }
  const { matchedCount, modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    { offer_status_history: { $elemMatch: faultyEntry } },
    { $set: { "offer_status_history.$[entry].reason": "seuil de 80 candidatures atteint" } },
    { arrayFilters: [{ "entry.granted_by": faultyEntry.granted_by, "entry.reason": faultyEntry.reason }], bypassDocumentValidation: true }
  )
  logger.info(`volet 4 — ${modifiedCount}/${matchedCount} offres requalifiées en "seuil de 80 candidatures atteint"`)
}

/**
 * Recopie dans `job_status_comment` le motif de la dernière clôture humaine qui l'a écrit, toutes
 * origines confondues (les clics sans modale, cf. ONE_CLICK_MAIL_REASONS, sont sautés). Sans effet si
 * cette entrée ne porte pas de motif (cf. NOT_A_MOTIF).
 */
const saveLastMotifInComment = async (filter: object) =>
  getDbCollection("jobs_partners").updateMany(
    filter,
    [
      {
        $set: {
          job_status_comment: {
            $let: {
              vars: {
                last: {
                  $last: {
                    $filter: {
                      input: "$offer_status_history",
                      cond: { $and: [{ $in: ["$$this.granted_by", Object.values(ORIGIN)] }, { $not: [{ $in: ["$$this.reason", ONE_CLICK_MAIL_REASONS] }] }] },
                    },
                  },
                },
              },
              in: { $cond: [{ $in: ["$$last.reason", NOT_A_MOTIF] }, "$job_status_comment", "$$last.reason"] },
            },
          },
        },
      },
    ],
    { bypassDocumentValidation: true }
  )

// Mise à jour de valeurs dans des documents existants, sans changement de schéma.
export const requireShutdown: boolean = false
