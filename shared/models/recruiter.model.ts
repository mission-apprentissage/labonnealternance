import { randomUUID } from "crypto"

import { Jsonify } from "type-fest"

import { OPCOS_LABEL, RECRUITER_STATUS } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"
import { ZJob } from "./job.model"

const allRecruiterStatus = Object.values(RECRUITER_STATUS)

const ZRecruiterWritable = z
  .object({
    establishment_id: z.string().default(randomUUID).describe("Identifiant de formulaire unique").openapi({
      default: "Random UUID",
    }),
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
    managed_by: z.string().nullish().describe("Id de l'utilisateur gestionnaire"),
  })
  .openapi("RecruiterWritable")

const collectionName = "recruiters" as const

export const ZRecruiter = ZRecruiterWritable.extend({
  _id: zObjectId,
  distance: z.number().nullish(),
  createdAt: z.date().describe("Date de creation"),
  updatedAt: z.date().describe("Date de mise à jour"),
}).openapi("Recruiter")
export type IRecruiter = z.output<typeof ZRecruiter>
export type IRecruiterJson = Jsonify<z.input<typeof ZRecruiter>>

export const ZRecruiterWithApplicationCount = ZRecruiter.omit({ jobs: true })
  .extend({
    jobs: z.array(
      ZJob.extend({
        candidatures: z.number(),
      })
    ),
  })
  .openapi("Recruiter")

export type IRecruiterWithApplicationCount = z.output<typeof ZRecruiterWithApplicationCount>

export const ZAnonymizedRecruiter = ZRecruiterWritable.pick({
  establishment_id: true,
  establishment_raison_sociale: true,
  establishment_enseigne: true,
  establishment_siret: true,
  address_detail: true,
  address: true,
  geo_coordinates: true,
  geopoint: true,
  is_delegated: true,
  cfa_delegated_siret: true,
  jobs: true,
  origin: true,
  opco: true,
  idcc: true,
  status: true,
  naf_code: true,
  naf_label: true,
  establishment_size: true,
  establishment_creation_date: true,
})

export type IAnonymizedRecruiter = z.output<typeof ZAnonymizedRecruiter>

export default {
  zod: ZRecruiter,
  indexes: [
    [{ geopoint: "2dsphere", status: 1, "jobs.job_status": 1, "jobs.rome_code": 1, "jobs.job_expiration_date": 1 }, {}],
    [{ establishment_id: 1 }, {}],
    [{ establishment_siret: 1 }, {}],
    [{ cfa_delegated_siret: 1 }, {}],
    [{ email: 1 }, {}],
    [{ email: 1, establishment_siret: 1 }, { unique: true }],
    [{ establishment_enseigne: 1 }, {}],
    [{ managed_by: 1 }, {}],
    [
      {
        "jobs.managed_by": 1,
      },
      {},
    ],

    // Support API v2 request (by ROME without location)
    [
      {
        "jobs.status": 1,
        "jobs.rome_code": 1,
        "jobs.job_creation_date": -1,
      },
      {},
    ],
    // Support API v2 request (without params)
    [
      {
        "jobs.status": 1,
        "jobs.job_creation_date": -1,
      },
      {},
    ],
  ],
  collectionName,
} as const satisfies IModelDescriptor
