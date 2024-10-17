import { internal } from "@hapi/boom"
import { oleoduc, writeData } from "oleoduc"
import { z } from "shared/helpers/zodWithOpenApi"
import { JOBPARTNERS_LABEL, ZJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { CollectionName } from "shared/models/models"
import { AnyZodObject } from "zod"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

export const rawToComputedJobsPartners = async <ZodInput extends AnyZodObject>({
  collectionSource,
  mapper,
  zodInput,
  partnerLabel,
  documentJobRoot,
}: {
  collectionSource: CollectionName
  zodInput: ZodInput
  mapper: (raw: z.output<ZodInput>) => IComputedJobsPartners
  partnerLabel: JOBPARTNERS_LABEL
  documentJobRoot?: string
}) => {
  logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel}`)
  const deletedCount = await getDbCollection("computed_jobs_partners").countDocuments({ partner_label: partnerLabel })
  logger.info(`suppression de ${deletedCount} documents dans computed_jobs_partners pour partner_label=${partnerLabel}`)
  await getDbCollection("computed_jobs_partners").deleteMany({ partner_label: partnerLabel })
  const counters = { total: 0, success: 0, error: 0 }
  await oleoduc(
    getDbCollection(collectionSource).find({}).stream(),
    writeData(
      async (document) => {
        counters.total++
        try {
          const rawJob = documentJobRoot ? document[documentJobRoot] : document
          const parsedDocument = zodInput.parse(rawJob)
          const computedJobPartner = mapper(parsedDocument)
          await getDbCollection("computed_jobs_partners").insertOne({
            ...computedJobPartner,
            partner_label: partnerLabel,
            validated: ZJobsPartnersOfferPrivate.safeParse(computedJobPartner).success,
          })
          counters.success++
        } catch (err) {
          counters.error++
          const newError = internal(`error converting raw job to partner_label job for partner_label=${partnerLabel}, id=${document._id}`)
          logger.error(newError.message, err)
          newError.cause = err
          sentryCaptureException(newError)
        }
      },
      { parallel: 10 }
    )
  )
  logger.info(`import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé`, counters)
}
