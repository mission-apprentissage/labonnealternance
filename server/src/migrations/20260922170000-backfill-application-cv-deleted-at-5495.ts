import { ApplicationScanStatus } from "shared/models/index"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * #5495 : les CV sont désormais conservés 1 an sur S3, au lieu d'être supprimés juste après l'envoi
 * au recruteur. Toutes les candidatures antérieures n'ont donc plus de CV. Sans ce backfill, le cron
 * de purge les rebalaierait chaque nuit indéfiniment et la page de suivi annoncerait un CV
 * consultable qui n'existe plus.
 *
 * On ne marque VOLONTAIREMENT pas les candidatures « en vol ». Le playbook de déploiement coupe
 * lba_jobs_processor mais laisse lba_server debout quand requireShutdown vaut false : au moment où
 * cette migration tourne, des candidatures non encore traitées ont leur CV sur S3. Les marquer
 * supprimées afficherait « CV indisponible » à tort pendant un an ET rendrait leur fichier orphelin
 * définitif, la clé S3 dérivant de _id. Les statuts exclus ci-dessous sont ceux pour lesquels
 * l'ancien processApplications sortait avant d'atteindre son deleteApplicationCvFile.
 * Ces laissés-null seront ramassés par le cron de purge dès la première nuit (un s3Delete sur une
 * clé absente est un no-op), ce qui nettoie au passage les orphelins historiques.
 *
 * bypassDocumentValidation : hors production la collection est en validationLevel strict +
 * validationAction error, et un document historique non conforme fait échouer TOUTE mise à jour,
 * même un $set sans rapport (cf. 20260901163000-normalize-naf-jobs-partners).
 */
export const up = async () => {
  // Filet pour les rares documents à created_at null : sans le $ifNull le champ vaudrait null, le
  // document serait lu « CV disponible » à tort et ne serait jamais purgé (null ne matche pas un
  // $lte sur une date, par bracketing de type).
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
              // Un CV infecté dont le s3Delete avait échoué est resté dans le bucket : le marquer
              // purgé le figerait là pour toujours. Laissé à null, la passe "virus" du cron le
              // reprend dès la première nuit (no-op si le fichier est bien parti).
              ApplicationScanStatus.VIRUS_DETECTED,
              // Statut legacy, plus jamais écrit, et qui ne matche aucun des trois filtres de
              // processApplicationGroup : ces candidatures n'ont donc jamais atteint
              // deleteApplicationCvFile et leur CV peut encore être dans le bucket. Mesuré le
              // 22/09/2026 : 113 documents de plus d'un an. Laissés à null, la passe "rétention"
              // du cron les nettoie dès la première nuit.
              ApplicationScanStatus.DO_NOT_SEND,
            ],
          },
        },
        { scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED, to_applicant_message_id: null },
      ],
    },
    // Daté avec created_at et non avec la date du run : l'ancien code supprimait le CV dans les
    // 10 minutes suivant le dépôt, la valeur est donc juste à quelques minutes près, et elle ne
    // raconte pas que des millions de CV ont été supprimés le même jour.
    [{ $set: { applicant_attachment_deleted_at: { $ifNull: ["$created_at", fallbackDate] } } }],
    { bypassDocumentValidation: true }
  )

  logger.info(`backfill-application-cv-deleted-at-5495 : ${result.modifiedCount} candidature(s) marquée(s) comme sans CV`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
