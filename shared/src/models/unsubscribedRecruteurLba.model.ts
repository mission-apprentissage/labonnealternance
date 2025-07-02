import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "unsubscribedrecruteurslba" as const

const ZUnsubscribedLbaCompany = z
  .object({
    _id: zObjectId,
    siret: z.string().describe("Le Siret de la société"), // use extension.siret
    raison_sociale: z.string().nullable().describe("Raison sociale de l'entreprise"),
    enseigne: z.string().describe("Enseigne de l'entreprise"),
    naf_code: z.string().describe("Code NAF de l'entreprise"),
    naf_label: z.string().describe("Intitulé du code NAF"),
    rome_codes: z.array(z.string()).describe("Liste des codes ROMEs au sein de l'entreprise"),
    insee_city_code: z.string().nullable().describe("Code commune INSEE"),
    zip_code: z.string().nullable().describe("Code postal"),
    city: z.string().nullable().describe("Ville"),
    company_size: z.string().nullable().describe("Tranche effectif de l'entreprise"),
    created_at: z.date().describe("La date création de la demande"),
    last_update_at: z.date().describe("Date de dernières mise à jour"),
    unsubscribe_date: z.coerce.date().describe("Date de désinscription"),
    unsubscribe_reason: z.string().describe("Raison de la désinscription"),
  })
  .strict()

export type IUnsubscribedLbaCompany = z.output<typeof ZUnsubscribedLbaCompany>

export default {
  zod: ZUnsubscribedLbaCompany,
  indexes: [[{ siret: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
