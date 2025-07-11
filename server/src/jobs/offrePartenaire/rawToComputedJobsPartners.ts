import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { internal } from "@hapi/boom"
import { Filter } from "mongodb"
import { z } from "shared/helpers/zodWithOpenApi"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { CollectionName } from "shared/models/models"
import { AnyZodObject } from "zod"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

export const rawToComputedJobsPartners = async <ZodInput extends AnyZodObject>({
  collectionSource,
  mapper,
  zodInput,
  partnerLabel,
  documentJobRoot,
  rawFilterQuery = {},
}: {
  collectionSource: CollectionName
  zodInput: ZodInput
  mapper: (raw: z.output<ZodInput>) => IComputedJobsPartners
  partnerLabel: JOBPARTNERS_LABEL
  documentJobRoot?: string
  rawFilterQuery?: Filter<CollectionName>
}) => {
  logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel}`)

  const deletedCount = await getDbCollection("computed_jobs_partners").countDocuments({ partner_label: partnerLabel })
  logger.info(`suppression de ${deletedCount} documents dans computed_jobs_partners pour partner_label=${partnerLabel}`)
  await getDbCollection("computed_jobs_partners").deleteMany({ partner_label: partnerLabel })

  const counters = { total: 0, success: 0, error: 0 }
  const importDate = new Date()

  const sourceStream = getDbCollection(collectionSource).find(rawFilterQuery).stream()

  await pipeline(
    sourceStream,
    new Writable({
      objectMode: true,
      async write(document: any, _encoding, callback) {
        counters.total++
        try {
          const rawJob = documentJobRoot ? document[documentJobRoot] : document
          const parsedDocument = zodInput.parse(rawJob)
          const computedJobPartner = mapper(parsedDocument)

          await getDbCollection("computed_jobs_partners").insertOne({
            ...computedJobPartner,
            partner_label: partnerLabel,
            created_at: importDate,
            updated_at: importDate,
            offer_status_history: [],
          })

          counters.success++
        } catch (err) {
          counters.error++
          const newError = internal(`error converting raw job to partner_label job for id=${document._id} partner_label=${partnerLabel}`)
          logger.error(newError.message, err)
          newError.cause = err
          sentryCaptureException(newError)
        }
        callback()
      },
    })
  )

  const message = `import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  logger.info(message)
  await notifyToSlack({
    subject: `mapping Raw => computed_jobs_partners`,
    message,
    error: counters.error > 0,
  })
}
