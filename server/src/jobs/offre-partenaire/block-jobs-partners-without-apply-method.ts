import type { Filter } from "mongodb"
import { jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { FillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"

// Chaîne vide, blancs seuls, null ou champ absent : $not matche aussi les champs absents.
const BLANK = { $not: /\S/ }

/**
 * Bloque les offres sans aucun moyen de candidature (#5872). Les recruteurs LBA et les offres LBA candidatent par LBA,
 * pas par les apply_*. Le business_error fait annuler l'offre publiée par cancelRemovedJobsPartners.
 */
export const blockJobsPartnersWithoutApplyMethod = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const jobLogger = logger.child({ job: "blockJobsPartnersWithoutApplyMethod" })

  const filter: Filter<IComputedJobsPartners> = {
    $and: [
      { business_error: null, partner_label: { $nin: jobPartnersExcludedFromFlux } },
      { apply_url: BLANK, apply_email: BLANK, apply_phone: BLANK },
      ...(addedMatchFilter ? [addedMatchFilter] : []),
    ],
  }

  const result = await getDbCollection("computed_jobs_partners").updateMany(filter, {
    $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.NO_APPLY_METHOD, updated_at: new Date() },
  })

  jobLogger.info(`offres bloquées sans moyen de candidature : ${result.modifiedCount}`)
  return { modifiedCount: result.modifiedCount }
}
