import { OPCOS_LABEL } from "shared/constants"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "
import { parseEnum } from "shared/utils"

import { getOpcoData } from "@/services/etablissement.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillOpcoInfosForPartners = async () => {
  const filledFields = ["workplace_idcc", "workplace_opco"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_OPCO,
    sourceFields: ["workplace_siret"],
    filledFields,
    getData: async ({ workplace_siret: siret }) => {
      if (!siret) {
        throw new Error("inattendu: pas de siret")
      }
      const response = await getOpcoData(siret)
      if (!response) {
        throw new Error("pas de réponse")
      }

      const { opco, idcc } = response
      let parsedIdcc: number | null = null
      if (idcc !== null && idcc !== undefined) {
        parsedIdcc = parseInt(idcc, 10)
        if (isNaN(parsedIdcc)) {
          parsedIdcc = null
        }
      }
      const result: Partial<Pick<IComputedJobsPartners, (typeof filledFields)[number]>> = {
        workplace_idcc: parsedIdcc,
        workplace_opco: parseEnum(OPCOS_LABEL, opco),
      }
      return result
    },
  })
}
