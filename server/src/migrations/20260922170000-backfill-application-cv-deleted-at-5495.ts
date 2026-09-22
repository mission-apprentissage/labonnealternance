import { ApplicationScanStatus } from "shared/models/index"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Marque comme purgées les candidatures dont le CV est absent de S3 (#5495), pour que
 * purgeApplicationCvFiles ne les rebalaie pas chaque nuit et que le suivi de candidature n'annonce
 * pas un CV consultable qui n'existe pas.
 *
 * Les statuts listés dans le $nor sont ceux dont le CV peut encore être dans le bucket : ceux pour
 * lesquels processApplications sort avant d'atteindre son deleteApplicationCvFile, et ceux qu'aucun
 * de ses filtres ne reprend. Les marquer rendrait leur fichier orphelin définitif (cf.
 * getApplicationCvS3Key). Laissés nuls, ils sont nettoyés par la première purge, un s3Delete sur une
 * clé absente étant un no-op.
 */
export const up = async () => {
  // $ifNull pour les rares documents à created_at null : le champ vaudrait null, le document serait
  // lu « CV disponible » et ne serait jamais purgé, null ne matchant pas un $lte sur une date.
  const fallbackDate = new Date()

  const result = await getDbCollection("applications").updateMany(
    {
      applicant_attachment_deleted_at: { $exists: false },
      $nor: [
        {
          scan_status: {
            $in: [
              ApplicationScanStatus.WAITING_FOR_SCAN,
              ApplicationScanStatus.ERROR_CLAMAV,
              ApplicationScanStatus.UNKNOWN_ERROR,
              ApplicationScanStatus.ERROR_APPLICANT_NOT_FOUND,
              ApplicationScanStatus.VIRUS_DETECTED,
              ApplicationScanStatus.DO_NOT_SEND,
            ],
          },
        },
        { scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED, to_applicant_message_id: null },
      ],
    },
    // created_at plutôt que la date du run, à quelques minutes près de la vraie suppression : dater
    // du jour raconterait une purge massive qui n'a pas eu lieu.
    [{ $set: { applicant_attachment_deleted_at: { $ifNull: ["$created_at", fallbackDate] } } }],
    { bypassDocumentValidation: true }
  )

  logger.info(`backfill-application-cv-deleted-at-5495 : ${result.modifiedCount} candidature(s) marquée(s) comme sans CV`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
