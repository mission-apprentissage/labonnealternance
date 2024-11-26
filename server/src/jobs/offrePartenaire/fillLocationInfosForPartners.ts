import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { joinNonNullStrings } from "shared/utils"

import { getCityFromProperties, getGeolocation, getReverseGeolocationFromApiAdresse, getStreetFromProperties } from "@/services/geolocation.service"

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
      const { workplace_address_label, workplace_geopoint } = document

      const geolocation = workplace_address_label
        ? await getGeolocation(workplace_address_label!)
        : workplace_geopoint && (await getReverseGeolocationFromApiAdresse(workplace_geopoint.coordinates[0], workplace_geopoint.coordinates[1]))

      if (!geolocation) {
        return []
      } else {
        const found_city = getCityFromProperties(geolocation)
        const found_zipcode = geolocation?.properties.postcode || null
        const found_street_label = getStreetFromProperties(geolocation)
        const found_geopoint = geolocation?.geometry || null
        const found_address_label = joinNonNullStrings([found_street_label, found_zipcode, found_city])

        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number]> = {
          workplace_address_label: found_address_label ?? null,
          workplace_address_street_label: found_street_label ?? null,
          workplace_address_city: found_city ?? null,
          workplace_address_zipcode: found_zipcode ?? null,
          workplace_geopoint: found_geopoint ?? null,
        }

        return [result]
      }
    },
  })
}
