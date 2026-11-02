import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { blockBadRomeJobsPartners } from "./block-bad-rome-jobs-partners"
import { fillLbaUrl } from "./fill-lba-url"
import { fillRomeForPartners } from "./fill-rome-for-partners"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"
import { jobPartnersByFlux } from "./process-job-partners"
import { buildUnlockedComputedJobPartnersFilter } from "./process-job-partners-for-api"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

/**
 * Offres flux sans ROME sorties d'une chaîne complète. La validation est la dernière étape de
 * fillComputedJobsPartners et rawToComputedJobsPartners insère les offres avec `errors: []` : une erreur
 * `validation` exclut toute offre reconstruite dont la chaîne n'est pas terminée (#5671).
 */
export const buildMissingRomeSelectionFilter = (): Filter<IComputedJobsPartners> => ({
  partner_label: { $in: jobPartnersByFlux },
  business_error: null,
  "errors.source": COMPUTED_ERROR_SOURCE.VALIDATION,
  $and: [{ $or: [{ offer_rome_codes: null }, { offer_rome_codes: { $size: 0 } }] }, buildUnlockedComputedJobPartnersFilter()],
})

/**
 * lba_url n'est posée que sur les offres que ce run vient d'importer : un fillLbaUrl sans filtre
 * parcourrait tout jobs_partners.
 */
export const fillLbaUrlForProcessedComputed = async (processFilter: Filter<IComputedJobsPartners>) => {
  const validatedOffers = await getDbCollection("computed_jobs_partners")
    .find({ $and: [processFilter, { validated: true, business_error: null }] }, { projection: { partner_label: 1, partner_job_id: 1 } })
    .toArray()

  const BATCH_SIZE = 500
  for (let i = 0; i < validatedOffers.length; i += BATCH_SIZE) {
    const chunk = validatedOffers.slice(i, i + BATCH_SIZE)
    await fillLbaUrl({
      addedMatchFilter: {
        $or: chunk.map(({ partner_label, partner_job_id }) => ({ partner_label, partner_job_id })),
      },
    })
  }
}

export const processMissingRomeAndImportToJobPartners = async () => {
  const processId = new ObjectId().toString()
  const { modifiedCount: selected } = await getDbCollection("computed_jobs_partners").updateMany(buildMissingRomeSelectionFilter(), {
    $set: { currently_processed_id: processId },
  })

  if (!selected) {
    return { selected }
  }

  logger.info({ selected }, "début de processMissingRomeAndImportToJobPartners")
  const processFilter = { currently_processed_id: processId }

  try {
    const filled = await fillRomeForPartners({ addedMatchFilter: processFilter })
    const blockedBadRome = await blockBadRomeJobsPartners({ addedMatchFilter: processFilter })
    const validated = await validateComputedJobPartners({ addedMatchFilter: processFilter })
    const imported = await importFromComputedToJobsPartners(processFilter)
    await fillLbaUrlForProcessedComputed(processFilter)

    return { selected, filled, blockedBadRome, validated, imported }
  } finally {
    await getDbCollection("computed_jobs_partners").updateMany(processFilter, { $set: { currently_processed_id: null } })
    logger.info("fin de processMissingRomeAndImportToJobPartners")
  }
}
