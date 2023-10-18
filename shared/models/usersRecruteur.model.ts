import { Jsonify } from "type-fest"

import { CFA, ETAT_UTILISATEUR } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"
import { zObjectId } from "./common"

const etatUtilisateurValues = Object.values(ETAT_UTILISATEUR)

export const ZUserStatusValidation = z
  .object({
    validation_type: z.enum(["AUTOMATIQUE", "MANUELLE"]).describe("Processus de validation lors de l'inscription de l'utilisateur"),
    status: z
      .enum([etatUtilisateurValues[0], ...etatUtilisateurValues.slice(1)])
      .nullish()
      .describe("Statut de l'utilisateur"),
    reason: z.string().nullish().describe("Raison du changement de statut"),
    user: z.string().describe("Utilisateur ayant effectué la modification | SERVEUR si le compte a été validé automatiquement"),
    date: z.date().nullish().describe("Date de l'évènement"),
  })
  .strict()

export const ZUserRecruteurWritable = z
  .object({
    last_name: z.string().describe("Nom de l'utilisateur"),
    first_name: z.string().describe("Prénom de l'utilisateur"),
    opco: z.string().nullish().describe("Information sur l'opco de l'entreprise"),
    idcc: z.string().nullish().describe("Identifiant convention collective de l'entreprise"),
    establishment_raison_sociale: z.string().nullish().describe("Raison social de l'établissement"),
    establishment_enseigne: z.string().nullish().describe("Enseigne de l'établissement"),
    establishment_siret: extensions.siret.describe("Siret de l'établissement"),
    address_detail: ZGlobalAddress.nullish().describe("Detail de l'adresse de l'établissement"),
    address: z.string().nullish().describe("Adresse de l'établissement"),
    geo_coordinates: z.string().nullish().describe("Latitude/Longitude de l'adresse de l'entreprise"),
    phone: extensions.phone.describe("Téléphone de l'établissement"),
    email: z.string().email().describe("L'email de l'utilisateur"),
    scope: z.string().nullish().describe("Scope accessible par l'utilisateur"),
    is_email_checked: z.boolean().describe("Indicateur de confirmation de l'adresse mail par l'utilisateur"),
    type: z.enum(["ENTREPRISE", "CFA", "OPCO", "ADMIN"]).describe("Type d'utilisateur"),
    establishment_id: z.string().nullish().describe("Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique"),
    last_connection: z.date().nullish().describe("Date de dernière connexion"),
    origin: z.string().nullish().describe("Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi"),
    status: z.array(ZUserStatusValidation).describe("Tableau des modifications de statut de l'utilisateur"),
    is_qualiopi: z.boolean().describe("Statut qualiopi du CFA (forcément true, sinon l'inscription n'est pas possibe)"),
  })
  .strict()

export const ZUserRecruteur = ZUserRecruteurWritable.omit({
  // Following field are not supposed to be nullish but they are...
  last_name: true,
  first_name: true,
  establishment_siret: true,
  phone: true,
  is_qualiopi: true,
}).extend({
  _id: zObjectId,
  createdAt: z.date().describe("Date de creation"),
  updatedAt: z.date().describe("Date de mise à jour"),
  last_name: ZUserRecruteurWritable.shape.last_name.nullish(),
  first_name: ZUserRecruteurWritable.shape.first_name.nullish(),
  establishment_siret: ZUserRecruteurWritable.shape.establishment_siret.nullish(),
  phone: ZUserRecruteurWritable.shape.phone.nullish(),
  is_qualiopi: ZUserRecruteurWritable.shape.is_qualiopi.nullish(),
})

export const zReferentielData = z
  .object({
    establishment_state: z.string(),
    is_qualiopi: z.boolean(),
    establishment_siret: z.string(),
    establishment_raison_sociale: z.string(),
    contacts: z.array(
      z
        .object({
          email: z.string(),
          confirmé: z.boolean(),
          sources: z.array(z.string()),
          date_collecte: z.string(),
        })
        .strict()
    ),
    address_detail: ZGlobalAddress,
    address: z.string(),
    geo_coordinates: z.string().nullish(),
  })
  .strict()

export type IReferentielData = z.output<typeof zReferentielData>

export type IUserStatusValidation = z.output<typeof ZUserStatusValidation>
export type IUserRecruteur = z.output<typeof ZUserRecruteur>
export type IUserRecruteurWritable = z.output<typeof ZUserRecruteurWritable>
export type IUserRecruteurJson = Jsonify<z.input<typeof ZUserRecruteur>>

export const ZUserRecruteurPublic = ZUserRecruteur.pick({
  _id: true,
  email: true,
  type: true,
  last_name: true,
  first_name: true,
  phone: true,
  opco: true,
  idcc: true,
  scope: true,
  establishment_siret: true,
  establishment_id: true,
}).extend({
  is_delegated: z.boolean(),
  cfa_delegated_siret: extensions.siret.nullish(),
  status_current: z.enum([etatUtilisateurValues[0], ...etatUtilisateurValues.slice(1)]).nullish(),
})
export type IUserRecruteurPublic = Jsonify<z.output<typeof ZUserRecruteurPublic>>

export const getUserStatus = (stateArray: IUserRecruteur["status"]) => {
  if (!stateArray) {
    return null
  }
  const sortedArray = [...stateArray].sort((a, b) => {
    return new Date(a?.date ?? 0).valueOf() - new Date(b?.date ?? 0).valueOf()
  })
  const lastValidationEvent = sortedArray.at(sortedArray.length - 1)
  if (!lastValidationEvent) {
    return null
  }
  return lastValidationEvent.status
}

export function toPublicUser(user: IUserRecruteur): z.output<typeof ZUserRecruteurPublic> {
  return {
    _id: user._id,
    email: user.email,
    type: user.type,
    last_name: user.last_name,
    first_name: user.first_name,
    phone: user.phone,
    opco: user.opco,
    idcc: user.idcc,
    scope: user.scope,
    establishment_siret: user.establishment_siret,
    establishment_id: user.establishment_id,
    is_delegated: user.type === CFA ? true : false,
    cfa_delegated_siret: user.type === CFA ? user.establishment_siret : undefined,
    status_current: getUserStatus(user.status),
  }
}
