import type { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { blockBadRomeJobsPartners } from "./block-bad-rome-jobs-partners"
import type { FillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"
import { fillEntrepriseEngagementComputedJobsPartners } from "./fill-entreprise-engagement-computed-jobs-partners"
import { fillLocationInfosForPartners } from "./fill-location-infos-for-partners"
import { fillOpcoInfosForPartners } from "./fill-opco-infos-for-partners"
import { formatTextFieldsJobsPartners } from "./format-text-fields-jobs-partners"
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
  const context: FillComputedJobsPartnersContext = { addedMatchFilter: computedJobFilter }

  await removeMissingRecruteursLbaFromComputedJobPartners()
  await removeUnsubscribedRecruteursLbaFromComputedJobPartners()
  await clearBlacklistedEmailsRecruteursLba()
  // reset checks
  await getDbCollection("computed_jobs_partners").updateMany(computedJobFilter, { $set: { business_error: null, jobs_in_success: [], errors: [] } })
  // Ce pipeline est distinct de fillComputedJobsPartners et n'héritait donc pas de la
  // normalisation NAF (issue #5344), alors que workplace_naf_label est ici le champ le plus
  // exposé : titre de carte éditoriale, secteur de la fiche, et slug d'URL via
  // buildLbaUrlFromJob. Sans effet sur les champs texte, offer_title et offer_description
  // valant la constante RECRUTEURS_LBA et non du texte libre.
  await formatTextFieldsJobsPartners(context)
  await fillEntrepriseEngagementComputedJobsPartners(context)
  await fillOpcoInfosForPartners(context)
  await blockBadRomeJobsPartners(context)
  await fillLocationInfosForPartners({ ...context, addedMatchFilter: { $and: [computedJobFilter, { workplace_geopoint: null }] } })
  await validateComputedJobPartners(context)
}
