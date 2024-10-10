import { Jsonify } from "type-fest"

import { AUTHTYPE, CFA, ETAT_UTILISATEUR, OPCOS_LABEL } from "../constants/recruteur"
import { removeUrlsFromText } from "../helpers/common"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress, ZPointGeometry } from "./address.model"
import { zObjectId } from "./common"
import { IUserWithAccount, ZValidationUtilisateur } from "./userWithAccount.model"

export const ZEtatUtilisateur = extensions.buildEnum(ETAT_UTILISATEUR).describe("Statut de l'utilisateur")

const authTypeValues = Object.values(AUTHTYPE)

export const ZUserStatusValidation = z
  .object({
    validation_type: ZValidationUtilisateur.describe("Processus de validation lors de l'inscription de l'utilisateur"),
    // TODO : check DB and remove nullish
    status: ZEtatUtilisateur.nullish(),
    reason: z.string().nullish().describe("Raison du changement de statut"),
    user: z.string().describe("Id de l'utilisateur ayant effectué la modification | 'SERVEUR' si le compte a été validé automatiquement"),
    date: z.date().nullish().describe("Date de l'évènement"),
  })
  .strict()

export const ZUserRecruteurWritable = z
  .object({
    last_name: z
      .string()
      .transform((value) => removeUrlsFromText(value))
      .describe("Nom de l'utilisateur"),
    first_name: z
      .string()
      .transform((value) => removeUrlsFromText(value))
      .describe("Prénom de l'utilisateur"),
    opco: extensions.buildEnum(OPCOS_LABEL).nullable().describe("Information sur l'opco de l'entreprise"),
    idcc: z.string().nullish().describe("Identifiant convention collective de l'entreprise"),
    establishment_raison_sociale: z.string().nullish().describe("Raison social de l'établissement"),
    establishment_enseigne: z.string().nullish().describe("Enseigne de l'établissement"),
    establishment_siret: extensions.siret.describe("Siret de l'établissement"),
    address_detail: ZGlobalAddress.nullish().describe("Detail de l'adresse de l'établissement"),
    address: z
      .string()
      .transform((value) => removeUrlsFromText(value))
      .nullish()
      .describe("Adresse de l'établissement"),
    geo_coordinates: z.string().nullish().describe("Latitude/Longitude de l'adresse de l'entreprise"),
    phone: extensions.phone().describe("Téléphone de l'établissement"),
    email: z.string().email().describe("L'email de l'utilisateur"),
    scope: z.string().nullish().describe("Scope accessible par l'utilisateur"),
    is_email_checked: z.boolean().describe("Indicateur de confirmation de l'adresse mail par l'utilisateur"),
    type: z.enum([authTypeValues[0], ...authTypeValues.slice(1)]).describe("Type d'utilisateur"),
    establishment_id: z.string().nullish().describe("Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique"),
    last_connection: z.date().nullish().describe("Date de dernière connexion"),
    origin: z.string().nullish().describe("Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi"),
    status: z.array(ZUserStatusValidation).describe("Tableau des modifications de statut de l'utilisateur"),
    is_qualiopi: z.boolean().describe("Statut qualiopi d'un CFA (toujours à true pour les CFA, false pour les entreprises)"),
  })
  .strict()

export const ZUserRecruteur = ZUserRecruteurWritable.omit({
  // Following field are not supposed to be nullish but they are...
  establishment_siret: true,
  phone: true,
  is_qualiopi: true,
}).extend({
  _id: zObjectId,
  createdAt: z.date().describe("Date de creation"),
  updatedAt: z.date().describe("Date de mise à jour"),
  establishment_siret: ZUserRecruteurWritable.shape.establishment_siret.nullish(),
  phone: ZUserRecruteurWritable.shape.phone.nullish(),
  is_qualiopi: ZUserRecruteurWritable.shape.is_qualiopi.nullish(),
})

export const ZCfaReferentielData = z
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
    geo_coordinates: z.string().max(40).nullish(),
    geopoint: ZPointGeometry.nullish(),
  })
  .strict()

export type ICfaReferentielData = z.output<typeof ZCfaReferentielData>
export type ICfaReferentielDataJson = Jsonify<z.input<typeof ZCfaReferentielData>>

export type IUserStatusValidation = z.output<typeof ZUserStatusValidation>
export type IUserStatusValidationJson = Jsonify<z.input<typeof ZUserStatusValidation>>
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
  establishment_id: true,
  establishment_siret: true,
  scope: true,
}).extend({
  cfa_delegated_siret: extensions.siret.nullish(),
  status_current: extensions.buildEnum(ETAT_UTILISATEUR).nullish(),
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

export function toPublicUser(
  user: IUserWithAccount,
  userRecruteurProps: Pick<IUserRecruteurPublic, "type" | "establishment_id" | "establishment_siret">
): z.output<typeof ZUserRecruteurPublic> {
  const { type, establishment_siret } = userRecruteurProps
  const cfa_delegated_siret = type === CFA ? establishment_siret : undefined
  return {
    ...userRecruteurProps,
    _id: user._id,
    email: user.email,
    last_name: user.last_name ?? "",
    first_name: user.first_name ?? "",
    phone: user.phone ?? "",
    cfa_delegated_siret,
  }
}

export const ZAnonymizedUserRecruteur = ZUserRecruteur.pick({
  opco: true,
  idcc: true,
  establishment_raison_sociale: true,
  establishment_enseigne: true,
  establishment_siret: true,
  address_detail: true,
  address: true,
  geo_coordinates: true,
  scope: true,
  is_email_checked: true,
  type: true,
  establishment_id: true,
  last_connection: true,
  origin: true,
  status: true,
  is_qualiopi: true,
})

export type IAnonymizedUserRecruteur = z.output<typeof ZAnonymizedUserRecruteur>

export const UserRecruteurForAdminProjection = {
  _id: true,
  establishment_raison_sociale: true,
  establishment_siret: true,
  type: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  createdAt: true,
  origin: true,
  opco: true,
  status: true,
} as const

export const ZUserRecruteurForAdmin = ZUserRecruteur.pick(UserRecruteurForAdminProjection).extend({
  organizationId: zObjectId,
})

export type IUserRecruteurForAdmin = z.output<typeof ZUserRecruteurForAdmin>
