import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { defaultFillComputedJobsPartnersContext, FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillEntrepriseEngagementJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext = defaultFillComputedJobsPartnersContext) => {
  const filledFields = ["contract_is_disabled_elligible"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.ENGAGEMENT_ENTREPRISE,
    sourceFields: ["workplace_siret"],
    filledFields,
    groupSize: 500,
    replaceMatchFilter: addedMatchFilter ?? {}, // run on all documents each time
    getData: async (documents) => {
      const sirets = [...new Set<string>(documents.flatMap(({ workplace_siret }) => (workplace_siret ? [workplace_siret] : [])))]
      const engagementsEntreprise = await getDbCollection("referentiel_engagement_entreprise")
        .find({ siret: { $in: sirets } })
        .toArray()

      return documents.map((document) => {
        const engagement = engagementsEntreprise.find((data) => data.siret === document.workplace_siret)
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          contract_is_disabled_elligible: engagement ? true : false,
        }
        return result
      })
    },
  })
}
