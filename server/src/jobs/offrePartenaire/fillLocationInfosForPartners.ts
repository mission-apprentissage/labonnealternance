import { IPointGeometry } from "shared/models/cacheGeolocation.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { joinNonNullStrings } from "shared/utils"

import { getGeolocation } from "@/services/geolocation.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillLocationInfosForPartners = async () => {
  const sourceFields = ["workplace_geopoint", "workplace_address_label"] as const satisfies (keyof IComputedJobsPartners)[]

  const filledFields = [
    "partner_label",
    "workplace_address_label",
    "workplace_address_street_label",
    "workplace_address_city",
    "workplace_address_zipcode",
    "workplace_geopoint",
  ] as const satisfies (keyof IComputedJobsPartners)[]

  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_ADRESSE,
    sourceFields,
    filledFields,
    groupSize: 1,
    getData: async (documents) => {
      const [document] = documents
      const { workplace_address_label, workplace_address_street_label, workplace_address_city, workplace_address_zipcode, workplace_geopoint } = document
      let found_city: string | null = null
      let found_street_label: string | null = null
      let found_zipcode: string | null = null
      let found_geopoint: IPointGeometry | null = null
      let found_address_label: string | null = null

      if (!workplace_geopoint) {
        const geolocation = await getGeolocation(workplace_address_label!)

        //TODO voir avec le métier concernant les détermination d'élément d'adresse abusifs (ex: GRAND EST -> Rue Grand)
        found_city = geolocation?.properties?.city ?? geolocation?.properties?.municipality ?? geolocation?.properties?.locality ?? null
        found_zipcode = geolocation?.properties.postcode || null
        found_street_label = geolocation?.properties?.street ? geolocation?.properties?.name : null
        found_geopoint = geolocation?.geometry || null
        found_address_label = joinNonNullStrings([found_street_label, found_zipcode, found_city])
      } else if (!workplace_address_label) {
        //getReverseGeolocationFromApiAdresse
      }
      //else  never

      const result: Pick<IComputedJobsPartners, (typeof filledFields)[number]> = {
        workplace_address_label: workplace_address_label ?? found_address_label ?? null,
        workplace_address_street_label: workplace_address_street_label ?? found_street_label ?? null,
        workplace_address_city: workplace_address_city ?? found_city ?? null,
        workplace_address_zipcode: workplace_address_zipcode ?? found_zipcode ?? null,
        workplace_geopoint: workplace_geopoint ?? found_geopoint ?? null,
      }

      return [result]
    },
  })
}
