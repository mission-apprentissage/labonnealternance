import { Jsonify } from "type-fest"
import { z } from "zod"

import { zObjectId } from "./common"

export const ZUserStatusValidation = z
  .object({
    validation_type: z.enum(["AUTOMATIQUE", "MANUELLE"]).describe("Processus de validation lors de l'inscription de l'utilisateur"),
    status: z.enum(["VALIDÉ", "DESACTIVÉ", "EN ATTENTE DE VALIDATION", "ERROR"]).describe("Statut de l'utilisateur"),
    reason: z.string().describe("Raison du changement de statut"),
    user: z.string().describe("Utilisateur ayant effectué la modification | SERVEUR si le compte a été validé automatiquement"),
    date: z.date().describe("Date de l'évènement"),
  })
  .strict()

export const ZUserRecruteur = z
  .object({
    _id: zObjectId,
    last_name: z.string().describe("Nom de l'utilisateur"),
    first_name: z.string().describe("Prénom de l'utilisateur"),
    opco: z.string().describe("Information sur l'opco de l'entreprise"),
    idcc: z.string().describe("Identifiant convention collective de l'entreprise"),
    establishment_raison_sociale: z.string().describe("Raison social de l'établissement"),
    establishment_enseigne: z.string().nullable().describe("Enseigne de l'établissement"),
    establishment_siret: z.string().describe("Siret de l'établissement"),
    address_detail: z.object().describe("Detail de l'adresse de l'établissement"),
    address: z.string().describe("Adresse de l'établissement"),
    geo_coordinates: z.string().nullable().describe("Latitude/Longitude de l'adresse de l'entreprise"),
    phone: z.string().describe("Téléphone de l'établissement"),
    email: z.string().nullable().describe("L'email de l'utilisateur"),
    scope: z.string().nullable().describe("Scope accessible par l'utilisateur"),
    is_email_checked: z.boolean().describe("Indicateur de confirmation de l'adresse mail par l'utilisateur"),
    type: z.enum(["ENTREPRISE", "CFA", "OPCO", "ADMIN"]).describe("Type d'utilisateur"),
    establishment_id: z.string().describe("Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique"),
    last_connection: z.date().nullable().describe("Date de dernière connexion"),
    origin: z.string().describe("Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi"),
    status: z.array(ZUserStatusValidation).describe("Tableau des modifications de statut de l'utilisateur"),
    is_qualiopi: z.boolean().describe("Statut qualiopi du CFA (forcément true, sinon l'inscription n'est pas possibe)"),
  })
  .strict()

export type IUserRecruteur = z.output<typeof ZUserRecruteur>
export type IUserRecruteurJson = Jsonify<z.input<typeof ZUserRecruteur>>
