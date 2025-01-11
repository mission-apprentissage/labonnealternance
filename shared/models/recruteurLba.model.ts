import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "recruteurslba" as const

export const ZLbaCompany = z
  .object({
    _id: zObjectId,
    siret: z.string().describe("Le Siret de la société"), // use extension.siret
    recruitment_potential: z.number().nullish().describe("Le score de recrutement de la société"),
    raison_sociale: z.string().nullable().describe("Raison sociale de l'entreprise"),
    enseigne: z.string().describe("Enseigne de l'entreprise"),
    naf_code: z.string().describe("Code NAF de l'entreprise"),
    naf_label: z.string().describe("Intitulé du code NAF"),
    rome_codes: z.array(z.string()).describe("Liste des codes ROMEs au sein de l'entreprise"),
    street_number: z.string().nullable().describe("Numéro dans la rue"),
    street_name: z.string().nullable().describe("Nom de la rue"),
    insee_city_code: z.string().nullable().describe("Code commune INSEE"),
    zip_code: z.string().nullable().describe("Code postal"),
    city: z.string().nullable().describe("Ville"),
    geo_coordinates: z.string().describe("Latitude et longitude de l'établissement"),
    geopoint: ZPointGeometry.nullish().describe("Latitude et longitude de l'établissement"),
    email: z.string().nullable().describe("Adresse email de contact"),
    phone: extensions.phone().nullable().describe("Numéro de téléphone de contact"),
    company_size: z.string().nullable().describe("Tranche effectif de l'entreprise"),
    website: z.string().nullable().describe("URL du site Internet"),
    opco: z.string().nullable().describe("L'OPCO de la société"),
    opco_short_name: z.string().nullable().describe("Nom court de l'opco"),
    opco_url: z.string().nullable().describe("L'URL spécifique liée à l'OPCO de la société"),
    created_at: z.date().describe("La date création de la demande"),
    last_update_at: z.date().describe("Date de dernières mise à jour"),
    distance: z.number().nullish().describe("Distance de la société au centre de recherche en km"),
  })
  .strict()
  .openapi("LbaCompany")

export type ILbaCompany = z.output<typeof ZLbaCompany>

export const ZLbaCompanyForContactUpdate = z.object({
  siret: z.string().describe("Le Siret de la société"), // use extension.siret
  enseigne: z.string().nullish().describe("Enseigne de l'entreprise"),
  email: z.string().nullish().describe("Adresse email de contact"),
  phone: extensions.phone().nullish().describe("Numéro de téléphone de contact"),
  active: z.boolean().describe("société présente dans recruteurslba ou non"),
})

export type ILbaCompanyForContactUpdate = z.output<typeof ZLbaCompanyForContactUpdate>

export default {
  zod: ZLbaCompany,
  indexes: [
    // all possible combination related to the search to facilitate the query
    [{ geopoint: "2dsphere", rome_codes: 1 }, {}],
    [{ geopoint: "2dsphere", rome_codes: 1, opco_short_name: 1 }, {}],
    [{ geopoint: "2dsphere", rome_codes: 1, opco_url: 1 }, {}],
    [{ geopoint: "2dsphere", rome_codes: 1, opco_url: 1, opco_short_name: 1 }, {}],
    [{ siret: 1 }, {}],
    [{ opco_short_name: 1 }, {}],
    [{ rome_codes: 1, size: 1 }, {}],

    // Support API v2 by ROME code without location
    [{ rome_codes: 1, last_update_at: -1 }, {}],
    // Support API v2 without params
    [{ last_update_at: -1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
