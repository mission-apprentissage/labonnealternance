import { Jsonify } from "type-fest"

import { ETAT_UTILISATEUR } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"
import { zObjectId } from "./common"

const etatUtilisateurValues = Object.values(ETAT_UTILISATEUR)

export const ZUserStatusValidation = z
  .object({
    validation_type: z.enum(["AUTOMATIQUE", "MANUELLE"]).describe("Processus de validation lors de l'inscription de l'utilisateur"),
    status: z.enum([etatUtilisateurValues[0], ...etatUtilisateurValues.slice(1)]).describe("Statut de l'utilisateur"),
    reason: z.string().nullish().describe("Raison du changement de statut"),
    user: z.string().describe("Utilisateur ayant effectué la modification | SERVEUR si le compte a été validé automatiquement"),
    date: z.date().describe("Date de l'évènement"),
  })
  .strict()

export const ZUserRecruteur = z
  .object({
    _id: zObjectId,
    last_name: z.string().describe("Nom de l'utilisateur"),
    first_name: z.string().describe("Prénom de l'utilisateur"),
    opco: z.string().nullish().describe("Information sur l'opco de l'entreprise"),
    idcc: z.string().nullish().describe("Identifiant convention collective de l'entreprise"),
    establishment_raison_sociale: z.string().nullish().describe("Raison social de l'établissement"),
    establishment_enseigne: z.string().nullish().describe("Enseigne de l'établissement"),
    establishment_siret: extensions.siret().describe("Siret de l'établissement"),
    address_detail: ZGlobalAddress.nullish().describe("Detail de l'adresse de l'établissement"),
    address: z.string().nullish().describe("Adresse de l'établissement"),
    geo_coordinates: z.string().nullish().describe("Latitude/Longitude de l'adresse de l'entreprise"),
    phone: extensions.phone().describe("Téléphone de l'établissement"),
    email: z.string().email().describe("L'email de l'utilisateur"),
    scope: z.string().nullish().describe("Scope accessible par l'utilisateur"),
    is_email_checked: z.boolean().describe("Indicateur de confirmation de l'adresse mail par l'utilisateur"),
    type: z.enum(["ENTREPRISE", "CFA", "OPCO", "ADMIN"]).describe("Type d'utilisateur"),
    establishment_id: z.string().nullish().describe("Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique"),
    last_connection: z.date().nullish().describe("Date de dernière connexion"),
    origin: z.string().nullish().describe("Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi"),
    status: z.array(ZUserStatusValidation).describe("Tableau des modifications de statut de l'utilisateur"),
    is_qualiopi: z.boolean().describe("Statut qualiopi du CFA (forcément true, sinon l'inscription n'est pas possibe)"),
    createdAt: z.date().describe("Date de création"),
    updatedAt: z.date().describe("Date de la dernière modification"),
  })
  .strict()

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
export type IUserRecruteurJson = Jsonify<z.input<typeof ZUserRecruteur>>
