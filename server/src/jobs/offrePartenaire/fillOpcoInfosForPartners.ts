import { OPCOS_LABEL } from "shared/constants"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { getOpcosData } from "@/services/etablissement.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillOpcoInfosForPartners = async () => {
  const filledFields = ["workplace_idcc", "workplace_opco"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_OPCO,
    sourceFields: ["workplace_siret"],
    filledFields,
    groupSize: 100,
    getData: async (documents) => {
      const sirets = [...new Set<string>(documents.flatMap(({ workplace_siret }) => (workplace_siret ? [workplace_siret] : [])))]
      const opcosData = await getOpcosData(sirets)

      return documents.map((document) => {
        const opcoData = opcosData.find((data) => data.siret === document.workplace_siret)
        if (!opcoData) {
          return {
            _id: document._id,
            workplace_idcc: null,
            workplace_opco: OPCOS_LABEL.UNKNOWN_OPCO,
          }
        }
        const { opco, idcc } = opcoData
        let parsedIdcc: number | null = null
        if (idcc !== null && idcc !== undefined) {
          parsedIdcc = parseInt(idcc, 10)
          if (isNaN(parsedIdcc)) {
            parsedIdcc = null
          }
        }
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          workplace_idcc: document.workplace_idcc ?? parsedIdcc,
          workplace_opco: document.workplace_opco ?? opco,
        }
        return result
      })
    },
  })
}
