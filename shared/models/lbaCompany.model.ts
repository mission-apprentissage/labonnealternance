import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "bonnesboites" as const

export const ZLbaCompany = z
  .object({
    _id: zObjectId,
    siret: z.string().describe("Le Siret de la société"),
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

export const ZLbaCompanyForContactUpdate = ZLbaCompany.pick({
  siret: true,
  email: true,
  phone: true,
  enseigne: true,
})
export type ILbaCompanyForContactUpdate = z.output<typeof ZLbaCompanyForContactUpdate>

export default {
  zod: ZLbaCompany,
  indexes: [
    [{ siret: 1 }, {}],
    [{ opco: 1 }, {}],
    [{ opco_short_name: 1 }, {}],
    [{ opco_url: 1 }, {}],
    [{ geopoint: "2dsphere" }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
