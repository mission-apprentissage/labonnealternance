import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"

import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import { defaultFillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const fillEntrepriseEngagementComputedJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext = defaultFillComputedJobsPartnersContext) => {
  const filledFields = ["contract_is_disabled_elligible"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.ENGAGEMENT_ENTREPRISE,
    sourceFields: ["workplace_siret"],
    filledFields,
    groupSize: 500,
    replaceMatchFilter: addedMatchFilter ?? {}, // run on all documents each time
    getData: async (documents) => {
      const sirets = [...new Set<string>(documents.flatMap(({ workplace_siret }) => (workplace_siret ? [workplace_siret] : [])))]
      const engagedSirets = await getDbCollection("referentiel_engagement_entreprise")
        .find({ siret: { $in: sirets }, sources: EntrepriseEngagementSources.FRANCE_TRAVAIL }, { projection: { siret: 1 } })
        .map(({ siret }) => siret)
        .toArray()
      const engagedSiretsSet = new Set(engagedSirets)

      return documents.map((document) => {
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          contract_is_disabled_elligible: engagedSiretsSet.has(document.workplace_siret ?? ""),
        }
        return result
      })
    },
  })
}
