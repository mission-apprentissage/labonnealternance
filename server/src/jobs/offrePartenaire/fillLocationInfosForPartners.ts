import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { joinNonNullStrings } from "shared/utils/index"

import { getCityFromProperties, getGeolocation, getStreetFromProperties } from "@/services/geolocation.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillLocationInfosForPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  const sourceFields = ["workplace_address_label"] as const satisfies (keyof IComputedJobsPartners)[]

  const filledFields = [
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
    addedMatchFilter,
    getData: async (documents) => {
      const [document] = documents
      const { workplace_address_label } = document

      const geolocation = await getGeolocation(workplace_address_label!)

      if (!geolocation) {
        return []
      } else {
        /*
        A ce stade, nous avons trouvé un match via la ban.
        Ce match est basé sur les éléments d'adresse fournis initialement par le producteur de la donnée
        Par souci de cohérence la proposition ci-dessous ne fourni que des éléments d'adresses retournés par la ban
        - on peut perdre les éléments qui avaient été déduits du siret à l'étape précédente (fillSiretInfosForPartners)
        - on réécrit complètement le address_label
        - la détermination de l'adresse par le siret peut induire des incohérences entre workplace_address_label et les autres éléments d'adresse
        */

        const found_city = getCityFromProperties(geolocation)
        const found_zipcode = geolocation?.properties.postcode || null
        const found_street_label = getStreetFromProperties(geolocation)
        const found_geopoint = geolocation?.geometry || null
        const found_address_label = joinNonNullStrings([found_street_label, found_zipcode, found_city])

        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
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
