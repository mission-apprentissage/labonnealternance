import { OPCOS_LABEL } from "shared/constants/index"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"

import { defaultFillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { getOpcosData } from "@/services/etablissement.service"

export const fillOpcoInfosForPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext = defaultFillComputedJobsPartnersContext) => {
  const filledFields = ["workplace_idcc", "workplace_opco"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForComputedPartnersFactory({
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
