import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"
import { zObjectId } from "./common"

export const ZEntreprise = z
  .object({
    _id: zObjectId,
    origin: z.string().nullish().describe("Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi"),
    createdAt: z.date(),
    updatedAt: z.date(),
    siret: z.string().describe("Siret de l'établissement"),
    raison_sociale: z.string().nullish().describe("Raison sociale de l'établissement"),
    enseigne: z.string().nullish().describe("Enseigne de l'établissement"),
    idcc: z.string().nullish().describe("Identifiant convention collective de l'entreprise"),
    address: z.string().nullish().describe("Adresse de l'établissement"),
    address_detail: ZGlobalAddress.nullish().describe("Detail de l'adresse de l'établissement"),
    geo_coordinates: z.string().nullish().describe("Latitude/Longitude de l'adresse de l'entreprise"),
    opco: z.string().nullish().describe("Opco de l'entreprise"),

    establishment_id: z.string().nullish().describe("Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique"),
  })
  .strict()

export type IEntreprise = z.output<typeof ZEntreprise>
export type IEntrepriseJson = Jsonify<z.input<typeof ZEntreprise>>
