import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"

import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOB_STATUS_ENGLISH } from "shared"
import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const fillEntrepriseEngagementJobsPartners = async () => {
  const filledFields = ["contract_is_disabled_elligible"] as const satisfies (keyof IJobsPartnersOfferPrivate)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.ENGAGEMENT_ENTREPRISE,
    sourceFields: ["workplace_siret"],
    filledFields,
    groupSize: 500,
    replaceMatchFilter: {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    },
    getData: async (documents) => {
      const sirets = [...new Set<string>(documents.flatMap(({ workplace_siret }) => (workplace_siret ? [workplace_siret] : [])))]
      const engagementsEntreprise = await getDbCollection("referentiel_engagement_entreprise")
        .find({ siret: { $in: sirets }, sources: EntrepriseEngagementSources.FRANCE_TRAVAIL })
        .toArray()

      return documents.map((document) => {
        const engagement = engagementsEntreprise.find((data) => data.siret === document.workplace_siret)
        const result: Pick<IJobsPartnersOfferPrivate, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          contract_is_disabled_elligible: engagement ? true : false,
        }
        return result
      })
    },
  })
}
