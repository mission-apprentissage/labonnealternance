import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "
import { isEnum } from "shared/utils"

import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"
import { getSiretInfos } from "@/services/cacheInfosSiret.service"
import { formatEntrepriseData } from "@/services/etablissement.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillSiretInfosForPartners = async () => {
  const filledFields = [
    "workplace_size",
    "workplace_name",
    "workplace_address_label",
    "workplace_geopoint",
    "workplace_naf_code",
    "workplace_naf_label",
  ] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_SIRET,
    sourceFields: ["workplace_siret"],
    filledFields,
    getData: async ({ workplace_siret: siret }) => {
      const response = await getSiretInfos(siret)
      if (!response) {
        throw new Error("pas de réponse")
      }
      if (isEnum(BusinessErrorCodes, response)) {
        throw new Error(response)
      }

      const { data } = response
      const { establishment_enseigne, establishment_raison_sociale, naf_code, naf_label, geo_coordinates, establishment_size, address } = formatEntrepriseData(data)

      const result: Partial<Pick<IComputedJobsPartners, (typeof filledFields)[number]>> = {
        workplace_size: establishment_size,
        workplace_name: establishment_enseigne ?? establishment_raison_sociale,
        workplace_address_label: address ?? undefined,
        workplace_geopoint: geo_coordinates ? convertStringCoordinatesToGeoPoint(geo_coordinates) : undefined,
        workplace_naf_code: naf_code,
        workplace_naf_label: naf_label,
      }
      return result
    },
  })
}
