import type { Filter, ObjectId } from "mongodb"
import type { IApplication } from "shared/models/index"
import { logger } from "@/common/logger"
import { asyncForEachGrouped } from "@/common/utils/async-utils"
import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

/**
 * Clé S3 d'un CV, dérivée de applications._id. Supprimer le document avant le fichier rend la clé
 * incalculable et l'objet orphelin définitif : toute suppression de candidature purge le CV d'abord.
 */
export const getApplicationCvS3Key = (applicationId: ObjectId) => `cv-${applicationId}`

export type ICvDeletionReport = {
  /** Candidatures pour lesquelles une suppression a été tentée. En dry-run : celles qui l'auraient été. */
  attempted: number
  /** Suppressions réellement effectuées. Toujours 0 en dry-run. */
  deleted: number
  failedKeys: string[]
  /** Candidatures éligibles laissées de côté faute de temps. Reprises au passage suivant. */
  remaining: number
}

const S3_CONCURRENCY = 20
const SENTRY_REPORT_CAP = 10

export const emptyCvDeletionReport = (): ICvDeletionReport => ({ attempted: 0, deleted: 0, failedKeys: [], remaining: 0 })

/**
 * Supprime de S3 les CV des candidatures ciblées par `filter` dont le CV n'est pas déjà purgé, puis
 * pose applicant_attachment_deleted_at sur les seuls succès.
 *
 * Ne supprime aucun document : à appeler avant tout $merge / insertMany / deleteMany sur
 * `applications` (cf. getApplicationCvS3Key).
 */
export const deleteCvFilesForApplications = async (
  filter: Filter<IApplication>,
  { context, batchSize = 500, dryRun = false, timeoutTs }: { context: string; batchSize?: number; dryRun?: boolean; timeoutTs?: number }
): Promise<ICvDeletionReport> => {
  const report = emptyCvDeletionReport()
  const collection = getDbCollection("applications")

  // Le filtre sur la date de purge évite des milliers d'appels S3 inutiles : en régime établi, une
  // candidature de plus de 2 ans a déjà été purgée à 1 an quand les jobs d'anonymisation la voient.
  const scopedFilter = { ...filter, applicant_attachment_deleted_at: null }
  const cursor = collection.find(scopedFilter, { projection: { _id: 1 } })

  let batch: ObjectId[] = []
  let interrupted = false

  const flush = async () => {
    if (!batch.length) return
    const current = batch
    batch = []
    const succeeded: ObjectId[] = []

    // try/catch dans le callback : asyncForEachGrouped fait un Promise.all par groupe, une rejection
    // ferait tomber tout le groupe.
    await asyncForEachGrouped(current, S3_CONCURRENCY, async (_id) => {
      report.attempted++
      if (dryRun) return
      try {
        await s3Delete("applications", getApplicationCvS3Key(_id))
        succeeded.push(_id)
      } catch (err) {
        report.failedKeys.push(getApplicationCvS3Key(_id))
        if (report.failedKeys.length <= SENTRY_REPORT_CAP) {
          sentryCaptureException(err, { data: { context, applicationId: _id.toString(), s3Key: getApplicationCvS3Key(_id) } })
        }
      }
    })

    if (succeeded.length) {
      // S3 d'abord, $set ensuite : sur échec S3 la date reste nulle et le passage suivant rejoue.
      await collection.updateMany({ _id: { $in: succeeded } }, { $set: { applicant_attachment_deleted_at: new Date() } })
      report.deleted += succeeded.length
    }
  }

  for await (const { _id } of cursor) {
    if (timeoutTs !== undefined && Date.now() >= timeoutTs) {
      interrupted = true
      await cursor.close()
      break
    }
    batch.push(_id)
    if (batch.length >= batchSize) {
      await flush()
    }
  }
  await flush()

  if (interrupted) {
    // Compté seulement ici : un countDocuments sur des millions de documents coûterait plus cher que
    // le travail lui-même les nuits où il n'y a rien à purger. En dry-run aucune date n'est posée,
    // donc les candidatures déjà parcourues sont encore dans le filtre et doivent être déduites.
    const stillMatching = await collection.countDocuments(scopedFilter)
    report.remaining = dryRun ? Math.max(0, stillMatching - report.attempted) : stillMatching
  }

  logger.info({ context, ...report, failedKeys: undefined, failedKeysCount: report.failedKeys.length, dryRun }, "suppression des CV terminée")
  return report
}
