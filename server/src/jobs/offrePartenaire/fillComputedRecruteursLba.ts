import { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { blockBadRomeJobsPartners } from "@/jobs/offrePartenaire/blockBadRomeJobsPartners"
import { FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import { fillEntrepriseEngagementJobsPartners } from "@/jobs/offrePartenaire/fillEntrepriseEngagementJobsPartners"
import { fillLocationInfosForPartners } from "@/jobs/offrePartenaire/fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "@/jobs/offrePartenaire/fillOpcoInfosForPartners"
import {
  removeMissingRecruteursLbaFromComputedJobPartners,
  removeUnsubscribedRecruteursLbaFromComputedJobPartners,
} from "@/jobs/offrePartenaire/recruteur-lba/importRecruteursLbaRaw"
import { validateComputedJobPartners } from "@/jobs/offrePartenaire/validateComputedJobPartners"

const computedJobFilter: Filter<IComputedJobsPartners> = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const fillComputedRecruteursLba = async () => {
  const context: FillComputedJobsPartnersContext = { addedMatchFilter: computedJobFilter, shouldNotifySlack: false }

  await removeMissingRecruteursLbaFromComputedJobPartners()
  await removeUnsubscribedRecruteursLbaFromComputedJobPartners()
  await fillEntrepriseEngagementJobsPartners(context)
  await fillOpcoInfosForPartners(context)
  await blockBadRomeJobsPartners(context)
  await fillLocationInfosForPartners(context)
  await validateComputedJobPartners(context)
}
