import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { getRomesInfos } from "../../services/cacheRomeo.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillRomeForPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  const filledFields = ["offer_rome_codes"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_ROMEO,
    sourceFields: ["offer_title", "workplace_naf_label"],
    filledFields,
    groupSize: 20, // max 20 appellations pour les appels ROMEO
    addedMatchFilter,
    getData: async (documents) => {
      const validDocuments = documents.flatMap((document) => (document.offer_title ? [document] : []))
      const queries = validDocuments.map(({ offer_title, workplace_naf_label }) => ({ intitule: offer_title!, contexte: workplace_naf_label }))
      const allRomeInfos = await getRomesInfos(queries)

      return validDocuments.flatMap((document, index) => {
        const romeInfos = allRomeInfos[index]
        if (!romeInfos) {
          return []
        }

        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          offer_rome_codes: [romeInfos],
        }
        return [result]
      })
    },
  })
}
