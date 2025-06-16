import { z } from "zod"
import { zObjectId } from "zod-mongodb-schema"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"

import { IModelDescriptor } from "./common.js"
import { ZJobsPartnersOfferPrivate } from "./jobsPartners.model.js"

export enum COMPUTED_ERROR_SOURCE {
  BLOCK_BAD_ROME = "BLOCK_BAD_ROME",
  API_SIRET = "api_siret",
  API_OPCO = "api_opco",
  API_ADRESSE = "api_adresse",
  API_ROMEO = "api_romeo",
  API_DIAGORIENTE = "api_diagoriente",
  API_NAF = "api_naf",
  VALIDATION = "validation",
  RANKING = "ranking",
  REMOVE_NAF_85 = "REMOVE_NAF_85",
}

export enum JOB_PARTNER_BUSINESS_ERROR {
  CLOSED_COMPANY = "CLOSED_COMPANY",
  DUPLICATE = "DUPLICATE",
  STAGE = "STAGE",
  EXPIRED = "EXPIRED",
  CFA = "CFA",
  ROME_BLACKLISTED = "ROME_BLACKLISTED",
  WRONG_DATA = "WRONG_DATA",
}

export const ZComputedJobsPartnersBase = extensions
  .optionalToNullish(ZJobsPartnersOfferPrivate.partial())
  .omit({
    _id: true,
    partner_job_id: true,
    partner_label: true,
    created_at: true,
  })
  .extend({
    _id: zObjectId,
    partner_job_id: ZJobsPartnersOfferPrivate.shape.partner_job_id,
    partner_label: ZJobsPartnersOfferPrivate.shape.partner_label,
    created_at: ZJobsPartnersOfferPrivate.shape.created_at,
  })

export const ZComputedJobsPartnersWrite = ZComputedJobsPartnersBase.omit({
  _id: true,
  created_at: true,
  updated_at: true,
  duplicates: true,
  rank: true,
  stats_detail_view: true,
  stats_postuler: true,
  stats_search_view: true,

  offer_creation: true,
  offer_expiration: true,
}).extend({
  offer_creation: z.string().datetime(),
  offer_expiration: z.string().datetime(),
})

export type IComputedJobsPartnersWrite = z.output<typeof ZComputedJobsPartnersWrite>

export const ZComputedJobsPartners = ZComputedJobsPartnersBase.extend({
  jobs_in_success: z.array(extensions.buildEnum(COMPUTED_ERROR_SOURCE)),
  errors: z.array(
    z
      .object({
        source: extensions.buildEnum(COMPUTED_ERROR_SOURCE),
        error: z.string(),
      })
      .nullable()
      .describe("Détail des erreurs rencontrées lors de la récupération des données obligatoires")
  ),
  validated: z.boolean().default(false).describe("Toutes les données nécessaires au passage vers jobs_partners sont présentes et valides (validation zod)"),
  business_error: z.string().nullable().default(null),
  currently_processed_id: z
    .string()
    .nullish()
    .describe("Si le champ est rempli, l'offre est en train d'être traitée. Les offres ayant le même id sont traitées dans le même batch"),
})
export type IComputedJobsPartners = z.output<typeof ZComputedJobsPartners>

export default {
  zod: ZComputedJobsPartners,
  indexes: [
    [{ partner_job_id: 1 }, {}],
    [{ partner_label: 1 }, {}],
    [{ partner_label: 1, partner_job_id: 1 }, { unique: true }],

    [{ created_at: 1 }, {}],
    [{ updated_at: 1 }, {}],
    [{ business_error: 1 }, {}],
    [{ errors: 1 }, {}],
    [{ "errors.source": 1 }, {}],
    [{ jobs_in_success: 1 }, {}],
    [{ "duplicates.partner_job_id": 1 }, {}],
    [{ "duplicates.partner_job_label": 1 }, {}],
    [{ validated: 1 }, {}],

    [{ workplace_siret: 1 }, {}],
    [{ workplace_brand: 1 }, {}],
    [{ workplace_legal_name: 1 }, {}],
    [{ workplace_name: 1 }, {}],
    [{ workplace_address_label: 1 }, {}],
    [{ offer_title: 1 }, {}],
    [{ workplace_naf_label: 1 }, {}],
  ],
  collectionName: "computed_jobs_partners" as const,
} as const satisfies IModelDescriptor
