import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"
import { withPartnerLocks } from "./partner-processing-lock"
import { jobPartnersByFlux } from "./process-job-partners"
import { buildUnlockedComputedJobPartnersFilter } from "./process-job-partners-for-api"
import { fillLbaUrlForProcessedComputed } from "./process-missing-rome-and-import-to-job-partners"

/** Laisse au traitement qui vient de reconstruire l'offre (run de nuit, cycle de journée) le temps de finir sa chaîne. */
export const NEVER_VALIDATED_MIN_AGE_MS = 2 * 60 * 60 * 1000

/**
 * Offres flux qu'aucune validation n'a examinées depuis leur reconstruction : chaîne interrompue
 * (traitement de nuit tué, MEP pendant le traitement). Une offre déjà examinée porte une erreur
 * `validation` (cf. processMissingRomeAndImportToJobPartners pour celles sans ROME), une offre en
 * échec d'import une erreur `DB_ERROR` : les exclure évite de les retraiter à chaque passage.
 */
export const buildNeverValidatedSelectionFilter = (now: Date = new Date()): Filter<IComputedJobsPartners> => ({
  partner_label: { $in: jobPartnersByFlux },
  validated: { $ne: true },
  business_error: null,
  "errors.source": { $nin: [COMPUTED_ERROR_SOURCE.VALIDATION, COMPUTED_ERROR_SOURCE.DB_ERROR] },
  created_at: { $lt: new Date(now.getTime() - NEVER_VALIDATED_MIN_AGE_MS) },
  ...buildUnlockedComputedJobPartnersFilter(),
})

/**
 * Rejoue la chaîne complète sur les seules offres revendiquées. Contrairement à
 * processJobPartnersWithFilter, ne supprime pas les computed validés, dont cancelRemovedJobsPartners
 * a besoin, et ne lance jamais l'annulation.
 */
export const processNeverValidatedJobPartners = async () => {
  const partnerLabels = await getDbCollection("computed_jobs_partners").distinct("partner_label", buildNeverValidatedSelectionFilter())
  if (!partnerLabels.length) {
    return { selected: 0 }
  }
  // Sans attente, comme processMissingRomeAndImportToJobPartners : un partenaire verrouillé est repris au passage suivant.
  return withPartnerLocks(partnerLabels, processNeverValidated, { requireAll: false })
}

const processNeverValidated = async (lockedPartnerLabels: string[]) => {
  const processId = new ObjectId().toString()
  const { modifiedCount: selected } = await getDbCollection("computed_jobs_partners").updateMany(
    { $and: [buildNeverValidatedSelectionFilter(), { partner_label: { $in: lockedPartnerLabels } }] },
    { $set: { currently_processed_id: processId } }
  )

  if (!selected) {
    return { selected }
  }

  logger.info({ selected }, "début de processNeverValidatedJobPartners")
  const processFilter = { currently_processed_id: processId }
  try {
    const filled = await fillComputedJobsPartners({ addedMatchFilter: processFilter })
    const imported = await importFromComputedToJobsPartners(processFilter)
    await fillLbaUrlForProcessedComputed(processFilter)
    return { selected, filled, imported }
  } finally {
    await getDbCollection("computed_jobs_partners").updateMany(processFilter, { $set: { currently_processed_id: null } })
    logger.info("fin de processNeverValidatedJobPartners")
  }
}
