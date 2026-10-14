import { ObjectId } from "bson"
import type { Jsonify } from "type-fest"

import { OPCOS_LABEL, RECRUITER_STATUS } from "../constants/recruteur.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import { ZPointGeometry } from "./address.model.js"
import { zObjectId } from "./common.js"
import { ZJob } from "./job.model.js"
import { ZReferentielRome } from "./rome.model.js"

const allRecruiterStatus = Object.values(RECRUITER_STATUS)

const ZRecruiterWritable = z.object({
  establishment_id: z
    .string()
    .default(() => new ObjectId().toString())
    .describe("Identifiant de formulaire unique"),
  establishment_raison_sociale: z.string().nullish().describe("Raison social de l'établissement"),
  establishment_enseigne: z.string().nullish().describe("Enseigne de l'établissement"),
  establishment_siret: z.string().describe("Numéro SIRET de l'établissement"),
  address_detail: z.any().describe("Détail de l'adresse de l'établissement"),
  address: z.string().nullish().describe("Adresse de l'établissement"),
  geo_coordinates: z.string().nullish().describe("Coordonnées geographique de l'établissement"),
  geopoint: ZPointGeometry.nullish().describe("Coordonnées geographique de l'établissement"),
  is_delegated: z.boolean().default(false),
  cfa_delegated_siret: z.string().nullish().describe("Siret de l'organisme de formation gestionnaire des offres de l'entreprise"),
  last_name: z.string().nullish().describe("Nom du contact"),
  first_name: z.string().nullish().describe("Prenom du contact"),
  phone: z.string().nullish().describe("Téléphone du contact"),
  email: z.string().describe("Email du contact"),
  jobs: z.array(ZJob).describe("Liste des offres"),
  origin: z.string().nullish().describe("Origine de la creation de l'établissement"),
  opco: extensions.buildEnum(OPCOS_LABEL).nullable().describe("Opco de rattachement de l'établissement"),
  idcc: z.number().nullable().describe("Identifiant de la convention collective de l'établissement"),
  status: z
    .enum([allRecruiterStatus[0], ...allRecruiterStatus.slice(1)])
    .default(RECRUITER_STATUS.ACTIF)
    .describe("Statut de l'établissement"),
  naf_code: z.string().nullish().describe("Code NAF de l'établissement"),
  naf_label: z.string().nullish().describe("Libellé NAF de l'établissement"),
  establishment_size: z.string().nullish().describe("Tranche d'effectif salariale de l'établissement"),
  establishment_creation_date: z.date().nullish().describe("Date de creation de l'établissement"),
  managed_by: z.string().describe("Id de l'utilisateur gestionnaire"),
})

export const ZRecruiter = ZRecruiterWritable.extend({
  _id: zObjectId,
  distance: z.number().nullish(),
  createdAt: z.date().describe("Date de creation"),
  updatedAt: z.date().describe("Date de mise à jour"),
})
export type IRecruiter = z.output<typeof ZRecruiter>
export type IRecruiterJson = Jsonify<z.input<typeof ZRecruiter>>

export const ZRecruiterWithRomeDetail = ZRecruiter.omit({ jobs: true }).extend({
  jobs: z.array(
    ZJob.extend({
      rome_detail: ZReferentielRome.nullish(),
    })
  ),
})

export type IRecruiterWithRomeDetail = z.output<typeof ZRecruiterWithRomeDetail>

export const ZRecruiterWithRomeDetailAndApplicationCount = ZRecruiter.omit({ jobs: true }).extend({
  jobs: z.array(
    ZJob.extend({
      candidatures: z.number(),
      rome_detail: ZReferentielRome.nullish(),
    })
  ),
})

export type IRecruiterWithRomeDetailAndApplicationCount = z.output<typeof ZRecruiterWithRomeDetailAndApplicationCount>
