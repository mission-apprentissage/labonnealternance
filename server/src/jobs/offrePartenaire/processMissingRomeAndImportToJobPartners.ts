import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { fillLbaUrl } from "./fillLbaUrl"
import { fillRomeForPartners } from "./fillRomeForPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { jobPartnersByFlux } from "./processJobPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

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
    await fillRomeForPartners({ addedMatchFilter: processFilter, shouldNotifySlack: false })
    await validateComputedJobPartners({ addedMatchFilter: processFilter, shouldNotifySlack: false })

    const validatedOffers = await getDbCollection("computed_jobs_partners")
      .find({ $and: [processFilter, { validated: true, business_error: null }] }, { projection: { partner_label: 1, partner_job_id: 1 } })
      .toArray()

    await importFromComputedToJobsPartners(processFilter, false)

    if (validatedOffers.length) {
      await fillLbaUrl({
        addedMatchFilter: {
          $or: validatedOffers.map(({ partner_label, partner_job_id }) => ({ partner_label, partner_job_id })),
        },
      })
    }
  } finally {
    await getDbCollection("computed_jobs_partners").updateMany(processFilter, { $set: { currently_processed_id: null } })
    logger.info("fin de processMissingRomeAndImportToJobPartners")
  }
}
