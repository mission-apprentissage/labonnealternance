import { randomUUID } from "crypto"

import { Jsonify } from "type-fest"
import { z } from "zod"

import { RECRUITER_STATUS } from "../constants/recruteur"

import { zObjectId } from "./common"
import { ZJob } from "./job.model"

const allRecruiterStatus = Object.values(RECRUITER_STATUS)

export const ZRecruiter = z.object({
  _id: zObjectId,
  establishment_id: z.string().default(randomUUID).describe("Identifiant de formulaire unique"),
  establishment_raison_sociale: z.string().nullable().describe("Raison social de l'établissement"),
  establishment_enseigne: z.string().nullable().describe("Enseigne de l'établissement"),
  establishment_siret: z.string().nullable().describe("Numéro SIRET de l'établissement"),
  address_detail: z.any().describe("Détail de l'adresse de l'établissement"),
  address: z.string().nullable().describe("Adresse de l'établissement"),
  geo_coordinates: z.string().nullable().describe("Coordonnées geographique de l'établissement"),
  is_delegated: z.boolean().default(false),
  cfa_delegated_siret: z.string().nullable().describe("Siret de l'organisme de formation gestionnaire des offres de l'entreprise"),
  last_name: z.string().nullable().describe("Nom du contact"),
  first_name: z.string().nullable().describe("Prenom du contact"),
  phone: z.string().nullable().describe("Téléphone du contact"),
  email: z.string().nullable().describe("Email du contact"),
  jobs: z.array(ZJob).describe("Liste des offres"),
  origin: z.string().nullable().describe("Origine de la creation de l'établissement"),
  opco: z.string().nullable().describe("Opco de rattachement de l'établissement"),
  idcc: z.string().nullable().describe("Identifiant de la convention collective de l'établissement"),
  status: z
    .enum([allRecruiterStatus[0], ...allRecruiterStatus.slice(-1)])
    .default(RECRUITER_STATUS.ACTIF)
    .describe("Statut de l'établissement"),
  naf_code: z.string().nullable().describe("Code NAF de l'établissement"),
  naf_label: z.string().nullable().describe("Libellé NAF de l'établissement"),
  establishment_size: z.string().nullable().describe("Tranche d'effectif salariale de l'établissement"),
  establishment_creation_date: z.date().nullable().describe("Date de creation de l'établissement"),
})

export type IRecruiter = z.output<typeof ZRecruiter>
export type IRecruiterJson = Jsonify<z.input<typeof ZRecruiter>>
