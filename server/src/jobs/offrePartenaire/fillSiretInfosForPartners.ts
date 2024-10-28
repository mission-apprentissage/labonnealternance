import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { IGeoPoint } from "shared/models"
import { IJobPartnerWorkplaceAddress } from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { isEnum } from "shared/utils"

import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"
import { getSiretInfos } from "@/services/cacheInfosSiret.service"
import { formatEntrepriseData } from "@/services/etablissement.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillSiretInfosForPartners = async () => {
  const filledFields = [
    "workplace_size",
    "workplace_name",
    "workplace_address",
    "workplace_geopoint",
    "workplace_naf_code",
    "workplace_naf_label",
    "workplace_brand",
    "workplace_legal_name",
  ] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_SIRET,
    sourceFields: ["workplace_siret"],
    filledFields,
    groupSize: 1,
    getData: async (documents) => {
      const [document] = documents
      const { workplace_siret: siret } = document

      const workplace_geopoint: IGeoPoint | null = "workplace_geopoint" in document ? (document.workplace_geopoint as IGeoPoint) : null
      const workplace_address: IJobPartnerWorkplaceAddress | null = "workplace_address" in document ? (document.workplace_address as IJobPartnerWorkplaceAddress) : null

      const response = await getSiretInfos(siret)
      if (!response) {
        return []
      }
      if (isEnum(BusinessErrorCodes, response)) {
        throw new Error(response)
      }

      const { data } = response
      const { establishment_enseigne, establishment_raison_sociale, naf_code, naf_label, geo_coordinates, establishment_size /*, address*/ } = formatEntrepriseData(data)

      const result: Pick<IComputedJobsPartners, (typeof filledFields)[number]> = {
        workplace_size: establishment_size,
        workplace_legal_name: establishment_raison_sociale,
        workplace_brand: establishment_enseigne,
        workplace_naf_code: naf_code,
        workplace_naf_label: naf_label,
        workplace_name: establishment_enseigne ?? establishment_raison_sociale,
        workplace_address: workplace_address || null,
        workplace_geopoint: workplace_geopoint || (geo_coordinates ? convertStringCoordinatesToGeoPoint(geo_coordinates) : undefined),
      }

      return [result]
    },
  })
}
