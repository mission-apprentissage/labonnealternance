import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { isEnum } from "shared/utils"

import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"
import { getSiretInfos } from "@/services/cacheInfosSiret.service"
import { addressDetailToStreetLabel, formatEntrepriseData } from "@/services/etablissement.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillSiretInfosForPartners = async () => {
  const filledFields = [
    "workplace_size",
    "workplace_name",
    "workplace_address_street_label",
    "workplace_address_country",
    "workplace_address_city",
    "workplace_address_zipcode",
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

      const response = await getSiretInfos(siret)
      if (!response) {
        return []
      }
      if (isEnum(BusinessErrorCodes, response)) {
        throw new Error(response)
      }

      const { data } = response
      const { establishment_enseigne, establishment_raison_sociale, naf_code, naf_label, geo_coordinates, establishment_size, address_detail } = formatEntrepriseData(data)
      const address_street_label = addressDetailToStreetLabel(address_detail)

      const result: Pick<IComputedJobsPartners, (typeof filledFields)[number]> = {
        workplace_size: document.workplace_size ?? establishment_size,
        workplace_legal_name: document.workplace_legal_name ?? establishment_raison_sociale,
        workplace_brand: document.workplace_brand ?? establishment_enseigne,
        workplace_naf_code: document.workplace_naf_code ?? naf_code,
        workplace_naf_label: document.workplace_naf_label ?? naf_label,
        workplace_name: document.workplace_name ?? establishment_enseigne ?? establishment_raison_sociale,
        workplace_address_street_label: document.workplace_address_street_label ?? address_street_label ?? null,
        workplace_address_city: document.workplace_address_city ?? address_detail?.libelle_commune ?? null,
        workplace_address_zipcode: document.workplace_address_zipcode ?? address_detail?.code_postal ?? null,
        workplace_address_country: document.workplace_address_country ?? address_detail?.libelle_pays_etranger ?? "France",
        workplace_geopoint: document.workplace_geopoint ?? (geo_coordinates ? convertStringCoordinatesToGeoPoint(geo_coordinates) : null),
      }

      return [result]
    },
  })
}
