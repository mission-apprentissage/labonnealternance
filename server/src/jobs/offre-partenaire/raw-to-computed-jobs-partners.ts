import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { internal } from "@hapi/boom"
import type { Filter } from "mongodb"
import { MongoServerError } from "mongodb"
import type { z } from "shared/helpers/zod-with-open-api"
import type { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import type { CollectionName } from "shared/models/models"
import type { ZodObject } from "zod"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { alertGuardrailBlock, formatRate, getGuardrailThresholds, JobPartnersGuardrailError } from "./jobs-partners-guardrails"
import { withPartnerLocks } from "./partner-processing-lock"
import { buildUnlockedComputedJobPartnersFilter } from "./process-job-partners-for-api"

// Couvre un run de « Process missing Rome » (maxRuntime 15 min) qui détiendrait déjà le verrou du partenaire.
export const RAW_TO_COMPUTED_LOCK_WAIT_MS = 20 * 60 * 1000

type TransformationCounters = { total: number; success: number; error: number; filtered: number; locked: number }

const getTransformationBlockReason = ({ success, error }: TransformationCounters, partnerLabel: string): string | null => {
  if (success === 0) {
    return "aucune offre transformée"
  }
  const errorRate = error / (success + error)
  const { maxTransformationErrorRate, minTransformationErrorCountToBlock } = getGuardrailThresholds(partnerLabel)
  if (errorRate > maxTransformationErrorRate && error >= minTransformationErrorCountToBlock) {
    return `${formatRate(errorRate)} d'offres en erreur de transformation (${error}/${success + error}), seuil ${formatRate(maxTransformationErrorRate)}`
  }
  return null
}

/**
 * Remplace le computed d'un partenaire par la transformation de son raw. Chaque offre est remplacée en place
 * (index unique partner_label + partner_job_id), les offres absentes du flux ne sont supprimées qu'une fois le lot
 * validé : au-delà du seuil d'erreurs de transformation, le job échoue et aucune offre ne sort du computed, donc
 * aucune n'est annulée (cf. cancelRemovedJobsPartners).
 */
export const rawToComputedJobsPartners = async <ZodInput extends ZodObject<any>>({
  collectionSource,
  mapper,
  zodInput,
  partnerLabel,
  documentJobRoot,
  rawFilterQuery = {},
}: {
  collectionSource: CollectionName
  zodInput: ZodInput
  mapper: (raw: z.output<ZodInput>) => IComputedJobsPartners | Promise<IComputedJobsPartners | null> | null
  partnerLabel: JOBPARTNERS_LABEL
  documentJobRoot?: string
  rawFilterQuery?: Filter<CollectionName>
}) =>
  withPartnerLocks(
    [partnerLabel],
    async () => {
      logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel}`)

      const counters: TransformationCounters = { total: 0, success: 0, error: 0, filtered: 0, locked: 0 }
      const importDate = new Date()
      const computedCollection = getDbCollection("computed_jobs_partners")

      const replaceComputed = async (computedJobPartner: IComputedJobsPartners) => {
        const { _id, ...replacement } = { ...computedJobPartner, partner_label: partnerLabel, created_at: importDate, updated_at: importDate, offer_status_history: [] }
        const key = { partner_label: partnerLabel, partner_job_id: replacement.partner_job_id }
        try {
          // created_at ≠ importDate : un doublon de partner_job_id dans le flux bute sur l'index unique au lieu d'écraser la première offre
          await computedCollection.replaceOne({ ...key, created_at: { $ne: importDate }, ...buildUnlockedComputedJobPartnersFilter() }, replacement, { upsert: true })
          counters.success++
        } catch (err) {
          const isClaimedByAnotherProcess =
            err instanceof MongoServerError &&
            err.code === 11000 &&
            (await computedCollection.countDocuments({ ...key, created_at: { $ne: importDate }, $nor: [buildUnlockedComputedJobPartnersFilter()] })) > 0
          if (!isClaimedByAnotherProcess) throw err
          counters.locked++
        }
      }

      await pipeline(
        getDbCollection(collectionSource).find(rawFilterQuery).stream(),
        new Writable({
          objectMode: true,
          async write(document: any, _encoding, callback) {
            counters.total++
            try {
              const rawJob = documentJobRoot ? document[documentJobRoot] : document
              const parsedDocument = zodInput.parse(rawJob)
              const computedJobPartner = await mapper(parsedDocument)
              if (computedJobPartner !== null) {
                await replaceComputed(computedJobPartner)
              } else {
                counters.filtered++
              }
            } catch (err) {
              counters.error++
              const newError = internal(`error converting raw job to partner_label job for id=${document._id} partner_label=${partnerLabel}`)
              logger.error(err, newError.message)
              newError.cause = err
              sentryCaptureException(newError)
            }
            callback()
          },
        })
      )

      logger.info({ counters }, `transformation du raw pour partner_label=${partnerLabel} terminée`)

      const blockReason = getTransformationBlockReason(counters, partnerLabel)
      if (blockReason) {
        const message = `${partnerLabel} : ${blockReason}. Le computed précédent est conservé, aucune offre ne sera annulée pour ce partenaire.`
        await alertGuardrailBlock(`Import ${partnerLabel}`, message)
        throw new JobPartnersGuardrailError(message)
      }

      const { deletedCount } = await computedCollection.deleteMany({
        partner_label: partnerLabel,
        created_at: { $ne: importDate },
        ...buildUnlockedComputedJobPartnersFilter(),
      })
      logger.info(
        `import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}, filtered=${counters.filtered}, locked=${counters.locked}, removed=${deletedCount}`
      )
      return counters
    },
    { requireAll: true, waitMs: RAW_TO_COMPUTED_LOCK_WAIT_MS }
  )
