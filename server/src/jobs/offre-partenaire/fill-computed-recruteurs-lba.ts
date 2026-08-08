import type { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { blockBadRomeJobsPartners } from "./block-bad-rome-jobs-partners"
import type { FillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"
import { fillEntrepriseEngagementComputedJobsPartners } from "./fill-entreprise-engagement-computed-jobs-partners"
import { fillLocationInfosForPartners } from "./fill-location-infos-for-partners"
import { fillOpcoInfosForPartners } from "./fill-opco-infos-for-partners"
import {
  clearBlacklistedEmailsRecruteursLba,
  removeMissingRecruteursLbaFromComputedJobPartners,
  removeUnsubscribedRecruteursLbaFromComputedJobPartners,
} from "./recruteur-lba/import-recruteurs-lba-raw"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

const computedJobFilter: Filter<IComputedJobsPartners> = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const fillComputedRecruteursLba = async () => {
  const context: FillComputedJobsPartnersContext = { addedMatchFilter: computedJobFilter, shouldNotifySlack: false }

  await removeMissingRecruteursLbaFromComputedJobPartners()
  await removeUnsubscribedRecruteursLbaFromComputedJobPartners()
  await clearBlacklistedEmailsRecruteursLba()
  // reset checks
  await getDbCollection("computed_jobs_partners").updateMany(computedJobFilter, { $set: { business_error: null, jobs_in_success: [], errors: [] } })
  await fillEntrepriseEngagementComputedJobsPartners(context)
  await fillOpcoInfosForPartners(context)
  await blockBadRomeJobsPartners(context)
  await fillLocationInfosForPartners({ ...context, addedMatchFilter: { $and: [computedJobFilter, { workplace_geopoint: null }] } })
  await validateComputedJobPartners(context)
}
