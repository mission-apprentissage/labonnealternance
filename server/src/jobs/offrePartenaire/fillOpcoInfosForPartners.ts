import { Filter } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/index"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { getOpcosData } from "@/services/etablissement.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillOpcoInfosForPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  const filledFields = ["workplace_idcc", "workplace_opco"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_OPCO,
    sourceFields: ["workplace_siret"],
    filledFields,
    groupSize: 100,
    addedMatchFilter,
    getData: async (documents) => {
      const sirets = [...new Set<string>(documents.flatMap(({ workplace_siret }) => (workplace_siret ? [workplace_siret] : [])))]
      const opcosData = await getOpcosData(sirets)

      return documents.map((document) => {
        const opcoData = opcosData.find((data) => data.siret === document.workplace_siret)
        if (!opcoData) {
          return {
            _id: document._id,
            workplace_idcc: document.workplace_idcc ?? null,
            workplace_opco: document.workplace_opco ?? OPCOS_LABEL.UNKNOWN_OPCO,
          }
        }

        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          workplace_idcc: document.workplace_idcc ?? opcoData.idcc,
          workplace_opco: document.workplace_opco ?? opcoData.opco,
        }
        return result
      })
    },
  })
}
