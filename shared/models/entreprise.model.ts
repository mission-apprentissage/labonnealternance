import { Jsonify } from "type-fest"

import { OPCOS_LABEL } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"
import { ZValidationUtilisateur } from "./userWithAccount.model"

export enum EntrepriseStatus {
  ERROR = "ERROR",
  VALIDE = "VALIDE",
  DESACTIVE = "DESACTIVE",
  A_METTRE_A_JOUR = "A_METTRE_A_JOUR",
}

export const ZEntrepriseStatusEvent = z
  .object({
    validation_type: ZValidationUtilisateur.describe("Indique si l'action est ordonnée par un utilisateur ou le serveur"),
    status: extensions.buildEnum(EntrepriseStatus).describe("Statut de l'accès"),
    reason: z.string().describe("Raison du changement de statut"),
    date: z.date().describe("Date de l'évènement"),
    granted_by: z.string().nullish().describe("Utilisateur à l'origine du changement"),
  })
  .strict()

export type IEntrepriseStatusEvent = z.output<typeof ZEntrepriseStatusEvent>

const collectionName = "entreprises" as const

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
    opco: extensions.buildEnum(OPCOS_LABEL).nullable().describe("Opco de l'entreprise"),
    naf_code: z.string().nullish().describe("Code NAF de l'entreprise"),
    naf_label: z.string().nullish().describe("Libelle NAF de l'entreprise"),
    status: z.array(ZEntrepriseStatusEvent).describe("historique de la mise à jour des données entreprise"),
  })
  .strict()

export type IEntreprise = z.output<typeof ZEntreprise>
export type IEntrepriseJson = Jsonify<z.input<typeof ZEntreprise>>

export default {
  zod: ZEntreprise,
  indexes: [
    [{ siret: 1 }, { unique: true }],
    [{ "status.status": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
