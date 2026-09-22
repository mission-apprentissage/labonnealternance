import { notifyToSlack } from "@/common/utils/slack-utils"
import type { ICvDeletionReport } from "@/services/application-cv.service"

const FAILED_KEYS_IN_SLACK = 50

/**
 * Signale les CV restés sur S3 alors que leurs candidatures ont été effacées. Le message porte les
 * clés parce qu'elles sont la seule trace exploitable une fois le document parti (cf.
 * getApplicationCvS3Key).
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
