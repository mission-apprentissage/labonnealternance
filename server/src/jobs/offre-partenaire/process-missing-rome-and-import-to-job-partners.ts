import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { fillLbaUrl } from "./fill-lba-url"
import { fillRomeForPartners } from "./fill-rome-for-partners"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"
import { jobPartnersByFlux } from "./process-job-partners"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

export const processMissingRomeAndImportToJobPartners = async () => {
  logger.info("début de processMissingRomeAndImportToJobPartners")

  const processId = new ObjectId().toString()
  const selectionFilter = {
    currently_processed_id: null,
    partner_label: { $in: jobPartnersByFlux },
    business_error: null,
    $or: [{ offer_rome_codes: null }, { offer_rome_codes: { $size: 0 } }],
  }

  await getDbCollection("computed_jobs_partners").updateMany(selectionFilter, { $set: { currently_processed_id: processId } })

  const processFilter = { currently_processed_id: processId }

  try {
    await fillRomeForPartners({ addedMatchFilter: processFilter })
    await validateComputedJobPartners({ addedMatchFilter: processFilter })

    const validatedOffers = await getDbCollection("computed_jobs_partners")
      .find({ $and: [processFilter, { validated: true, business_error: null }] }, { projection: { partner_label: 1, partner_job_id: 1 } })
      .toArray()

    await importFromComputedToJobsPartners(processFilter)

    const BATCH_SIZE = 500
    for (let i = 0; i < validatedOffers.length; i += BATCH_SIZE) {
      const chunk = validatedOffers.slice(i, i + BATCH_SIZE)
      await fillLbaUrl({
        addedMatchFilter: {
          $or: chunk.map(({ partner_label, partner_job_id }) => ({ partner_label, partner_job_id })),
        },
      })
    }
  } finally {
    await getDbCollection("computed_jobs_partners").updateMany(processFilter, { $set: { currently_processed_id: null } })
    logger.info("fin de processMissingRomeAndImportToJobPartners")
  }
}
