import { notifyToSlack } from "@/common/utils/slack-utils"
import type { ICvDeletionReport } from "@/services/application-cv.service"

const FAILED_KEYS_IN_SLACK = 50

/**
 * Rend visible le mode dégradé d'un job d'anonymisation qui a supprimé des candidatures sans avoir
 * pu supprimer leurs CV. Les clés S3 figurent dans le message parce qu'une fois le document
 * supprimé, elles sont la seule trace permettant de retrouver le fichier devenu orphelin.
 */
export const notifyCvDeletionFailures = async (subject: string, report: ICvDeletionReport) => {
  if (!report.failedKeys.length) return
  await notifyToSlack({
    subject,
    message:
      `Mode dégradé : ${report.failedKeys.length} CV n'ont pas pu être supprimés de S3 alors que les candidatures ont été effacées. ` +
      `Ces fichiers sont désormais orphelins et doivent être supprimés manuellement.\r\n` +
      `Clés S3 (${FAILED_KEYS_IN_SLACK} max) :\r\n - ${report.failedKeys.slice(0, FAILED_KEYS_IN_SLACK).join("\r\n - ")}`,
    error: true,
  })
}
