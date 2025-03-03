import { Filter } from "mongodb"
import { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { blockBadRomeJobsPartners } from "@/jobs/offrePartenaire/blockBadRomeJobsPartners"
import { fillLocationInfosForPartners } from "@/jobs/offrePartenaire/fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "@/jobs/offrePartenaire/fillOpcoInfosForPartners"
import { importFromComputedToJobsPartners } from "@/jobs/offrePartenaire/importFromComputedToJobsPartners"
import { removeMissingRecruteursLbaFromRaw } from "@/jobs/offrePartenaire/recruteur-lba/importRecruteursLbaRaw"
import { validateComputedJobPartners } from "@/jobs/offrePartenaire/validateComputedJobPartners"

const filter: Filter<IComputedJobsPartners | IJobsPartnersOfferPrivate> = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const fillComputedRecruteursLba = async () => {
  await removeMissingRecruteursLbaFromRaw()
  await fillOpcoInfosForPartners(filter)
  await fillLocationInfosForPartners(filter)
  await blockBadRomeJobsPartners(filter)
  await validateComputedJobPartners(filter)
}

export const importRecruteursLbaFromComputedToJobsPartners = async () => {
  await getDbCollection("jobs_partners").deleteMany(filter as IJobsPartnersOfferPrivate)
  await importFromComputedToJobsPartners(filter)
}
