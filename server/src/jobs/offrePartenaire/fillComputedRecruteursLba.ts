import type { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { blockBadRomeJobsPartners } from "./blockBadRomeJobsPartners"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillEntrepriseEngagementComputedJobsPartners } from "./fillEntrepriseEngagementComputedJobsPartners"
import { fillLocationInfosForPartners } from "./fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { removeMissingRecruteursLbaFromComputedJobPartners, removeUnsubscribedRecruteursLbaFromComputedJobPartners } from "./recruteur-lba/importRecruteursLbaRaw"
import { validateComputedJobPartners } from "./validateComputedJobPartners"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const computedJobFilter: Filter<IComputedJobsPartners> = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const fillComputedRecruteursLba = async () => {
  const context: FillComputedJobsPartnersContext = { addedMatchFilter: computedJobFilter, shouldNotifySlack: false }

  await removeMissingRecruteursLbaFromComputedJobPartners()
  await removeUnsubscribedRecruteursLbaFromComputedJobPartners()
  // reset checks
  await getDbCollection("computed_jobs_partners").updateMany(computedJobFilter, { $set: { business_error: null, jobs_in_success: [], errors: [] } })
  await fillEntrepriseEngagementComputedJobsPartners(context)
  await fillOpcoInfosForPartners(context)
  await blockBadRomeJobsPartners(context)
  await fillLocationInfosForPartners({ ...context, addedMatchFilter: { $and: [computedJobFilter, { workplace_geopoint: null }] } })
  await validateComputedJobPartners(context)
}
