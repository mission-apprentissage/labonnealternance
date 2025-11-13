import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { joinNonNullStrings } from "shared/utils/index"

import { getCityFromProperties, getGeolocation, getStreetFromProperties } from "@/services/geolocation.service"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { defaultFillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

const API_ADRESSE_MIN_SCORE = 0.6 // entre 0 et 1, 1 signifiant que l'api est certaine de sa réponse
// j'ai pu constater des adresses à strasbourg alors que la vraie adresse est à Caen avec un score à 0.52 : https://api-adresse.data.gouv.fr/search?q=General%20Eisenhower%2014000%20CAEN

export const fillLocationInfosForPartners = async ({ addedMatchFilter, shouldNotifySlack }: FillComputedJobsPartnersContext = defaultFillComputedJobsPartnersContext) => {
  const sourceFields = ["workplace_address_label"] as const satisfies (keyof IComputedJobsPartners)[]

  const filledFields = [
    "workplace_address_label",
    "workplace_address_street_label",
    "workplace_address_city",
    "workplace_address_zipcode",
    "workplace_geopoint",
    "business_error",
  ] as const satisfies (keyof IComputedJobsPartners)[]

  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_ADRESSE,
    sourceFields,
    filledFields,
    groupSize: 1,
    addedMatchFilter,
    getData: async (documents) => {
      const [document] = documents
      const { workplace_address_label, workplace_geopoint, workplace_address_zipcode, workplace_address_city } = document
      if (!workplace_address_label) {
        return []
      }

      let geolocation = await getGeolocationWithMinScore(workplace_address_label)

      if (!geolocation) {
        if (workplace_geopoint) {
          // on est capable de geolocaliser l'offre => non bloquant
          return []
        }
        // on essaie de géolocaliser avec le code postal et la ville
        if (workplace_address_zipcode && workplace_address_city) {
          geolocation = await getGeolocationWithMinScore(`${workplace_address_zipcode} ${workplace_address_city}`)
        }

        if (!geolocation) {
          // pas de geolocalisation => l'offre ne doit pas être publiée
          const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
            _id: document._id,
            business_error: JOB_PARTNER_BUSINESS_ERROR.GEOLOCATION_NOT_FOUND,
          }
          return [result]
        }
      }
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
        business_error: document.business_error ?? null,
      }

      return [result]
    },
    shouldNotifySlack,
  })
}

async function getGeolocationWithMinScore(text: string) {
  const geolocation = await getGeolocation(text)
  const score = geolocation?.properties.score
  if (score && score <= API_ADRESSE_MIN_SCORE) {
    return null
  }
  return geolocation
}
