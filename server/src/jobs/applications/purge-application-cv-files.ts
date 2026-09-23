import { internal } from "@hapi/boom"
import { APPLICATION_CV_RETENTION_YEARS } from "shared/constants/application"
import dayjs from "shared/helpers/dayjs"
import { ApplicationScanStatus } from "shared/models/index"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import type { ICvDeletionReport } from "@/services/application-cv.service"
import { deleteCvFilesForApplications } from "@/services/application-cv.service"

const SLACK_SUBJECT = "PURGE DES CV"
const FAILED_KEYS_IN_SLACK = 20
// Sous le plafond par défaut de job-processor (maxRuntimeInMinutes: 60).
const MAX_DURATION_MS = 1000 * 60 * 20

export type IPurgeApplicationCvFilesPayload = {
  before?: string
  dryRun?: boolean
}

/**
 * Candidatures que processApplications reprend encore, c'est-à-dire les trois filtres de son
 * processApplicationGroup. Purger leur CV sans les rendre terminales les ferait échouer toutes les
 * 10 minutes sur un fichier absent (getApplicationAttachmentContent lève "cv vide").
 */
const UNPROCESSABLE_AFTER_PURGE = [
  { scan_status: { $in: [ApplicationScanStatus.WAITING_FOR_SCAN, ApplicationScanStatus.ERROR_CLAMAV] } },
  { scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED, to_applicant_message_id: null },
]

/**
 * Supprime de S3 les CV des candidatures de plus de APPLICATION_CV_RETENTION_YEARS an(s) (#5495).
 *
 * Le filtre created_at $lte est ouvert, donc une nuit sautée est rattrapée le lendemain, et une
 * candidature déjà purgée est exclue par applicant_attachment_deleted_at.
 */
export const purgeApplicationCvFiles = async (payload: IPurgeApplicationCvFilesPayload = {}) => {
  const now = new Date()
  const dryRun = payload.dryRun === true
  const timeoutTs = now.getTime() + MAX_DURATION_MS
  const cutoff = payload.before ? new Date(payload.before) : dayjs(now).subtract(APPLICATION_CV_RETENTION_YEARS, "year").toDate()

  // Une coupure illisible ou au futur purgerait la totalité des CV encore sous rétention.
  if (Number.isNaN(cutoff.getTime())) {
    throw internal(`purgeApplicationCvFiles : date de coupure illisible (${payload.before})`)
  }
  if (cutoff.getTime() > now.getTime()) {
    throw internal(`purgeApplicationCvFiles : date de coupure dans le futur (${cutoff.toISOString()}), refus de purger des CV encore sous rétention`)
  }

  logger.info({ cutoff, dryRun }, "[START] purge des CV")

  try {
    // Deux passes plutôt qu'un $or, pour que chacune garde son plan d'index :
    // {applicant_attachment_deleted_at, created_at} d'un côté, {scan_status} de l'autre.
    const expired = await deleteCvFilesForApplications({ created_at: { $lte: cutoff } }, { context: "purge-cv-expired", dryRun, timeoutTs })
    // Filet pour les fichiers infectés dont la suppression a échoué dans process-applications : ils
    // ne doivent pas attendre un an.
    const infected = await deleteCvFilesForApplications({ scan_status: ApplicationScanStatus.VIRUS_DETECTED }, { context: "purge-cv-virus", dryRun, timeoutTs })

    const markedUnprocessable = dryRun ? 0 : await markUnprocessableApplications(cutoff)

    const report: ICvDeletionReport = {
      attempted: expired.attempted + infected.attempted,
      deleted: expired.deleted + infected.deleted,
      failedKeys: [...expired.failedKeys, ...infected.failedKeys],
      remaining: expired.remaining + infected.remaining,
    }

    // Levé avant la notification de mode dégradé, pour que le catch poste un seul message. Sans ce
    // throw, un run intégralement en échec laisse le monitor vert et ressemble à une nuit sans
    // travail.
    if (report.deleted === 0 && report.failedKeys.length > 0) {
      throw internal(`purgeApplicationCvFiles : ${report.failedKeys.length} suppression(s) S3 en échec, aucune réussie`)
    }

    await notifyPurgeReport(report, { dryRun, markedUnprocessable })

    logger.info({ ...report, failedKeys: undefined, failedKeysCount: report.failedKeys.length, markedUnprocessable, dryRun }, "[END] purge des CV")
    return { ...report, markedUnprocessable }
  } catch (err) {
    await notifyToSlack({ subject: SLACK_SUBJECT, message: "ECHEC de la purge des CV", error: true })
    throw err
  }
}

const notifyPurgeReport = async (report: ICvDeletionReport, { dryRun, markedUnprocessable }: { dryRun: boolean; markedUnprocessable: number }) => {
  if (report.failedKeys.length || report.remaining) {
    const failures = report.failedKeys.length
      ? `\r\nClés S3 en échec (${FAILED_KEYS_IN_SLACK} max) :\r\n - ${report.failedKeys.slice(0, FAILED_KEYS_IN_SLACK).join("\r\n - ")}`
      : ""
    await notifyToSlack({
      subject: SLACK_SUBJECT,
      message:
        `Purge des CV terminée en mode dégradé. ${report.deleted} CV supprimé(s), ${report.failedKeys.length} échec(s) sur ${report.attempted} tentative(s), ` +
        `${report.remaining} non traité(s) faute de temps.${failures}`,
      error: true,
    })
    return
  }

  // Silence quand il n'y a rien à purger : le cron ne trouve du travail qu'au-delà de la durée de
  // rétention, inutile de poster "0 CV supprimé" toutes les nuits d'ici là.
  if (!report.attempted) return

  await notifyToSlack({
    subject: SLACK_SUBJECT,
    message:
      `Purge des CV terminée. ${report.deleted} CV supprimé(s)${dryRun ? ` (simulation sur ${report.attempted} candidature(s), rien n'a été supprimé)` : ""}` +
      `${markedUnprocessable ? `, ${markedUnprocessable} candidature(s) passée(s) en ${ApplicationScanStatus.CV_PURGED}` : ""}.`,
  })
}

/**
 * Rend terminales les candidatures anciennes dont le CV vient d'être purgé mais que
 * processApplications reprendrait encore. Le garde sur applicant_attachment_deleted_at laisse de
 * côté celles dont la suppression S3 a échoué, pour qu'elles soient retentées.
 */
const markUnprocessableApplications = async (cutoff: Date) => {
  const { modifiedCount } = await getDbCollection("applications").updateMany(
    {
      created_at: { $lte: cutoff },
      applicant_attachment_deleted_at: { $ne: null },
      $or: UNPROCESSABLE_AFTER_PURGE,
    },
    { $set: { scan_status: ApplicationScanStatus.CV_PURGED } }
  )
  return modifiedCount
}
