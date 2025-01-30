import { z } from "zod"

import { IModelDescriptor, zObjectId } from "shared/models/common.js"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"

import { ZJobsPartnersOfferPrivate } from "./jobsPartners.model.js"

const collectionName = "computed_jobs_partners" as const

export enum COMPUTED_ERROR_SOURCE {
  API_SIRET = "api_siret",
  API_OPCO = "api_opco",
  API_ADRESSE = "api_adresse",
  API_ROMEO = "api_romeo",
  VALIDATION = "validation",
  RANKING = "RANKING",
}

export enum JOB_PARTNER_BUSINESS_ERROR {
  CLOSED_COMPANY = "CLOSED_COMPANY",
  DUPLICATE = "DUPLICATE",
  ZOD_VALIDATION = "ZOD_VALIDATION",
  STAGE = "STAGE",
  EXPIRED = "EXPIRED",
}

export const ZComputedJobPartnersDuplicateRef = z.object({
  otherOfferId: zObjectId,
  collectionName: z.enum(["recruiters", collectionName]).describe("nom de la collection contenant l'offre avec _id=otherOfferId"),
  reason: z.string(),
})

export type IComputedJobPartnersDuplicateRef = z.output<typeof ZComputedJobPartnersDuplicateRef>

export const ZComputedJobsPartners = extensions
  .optionalToNullish(ZJobsPartnersOfferPrivate.partial())
  .omit({
    _id: true,
    partner_job_id: true,
  })
  .extend({
    _id: zObjectId,
    partner_job_id: ZJobsPartnersOfferPrivate.shape.partner_job_id,
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
    duplicates: z.array(ZComputedJobPartnersDuplicateRef).nullish().describe("Référence les autres offres en duplicata avec celle-ci"),
  })
export type IComputedJobsPartners = z.output<typeof ZComputedJobsPartners>

export default {
  zod: ZComputedJobsPartners,
  indexes: [
    [{ partner_job_id: 1 }, {}],
    [{ partner_label: 1 }, {}],
    [{ validated: 1 }, {}],
    [{ errors: 1 }, {}],
    [{ partner_label: 1, partner_job_id: 1 }, { unique: true }],
    [{ workplace_siret: 1 }, {}],
    [{ jobs_in_success: 1 }, {}],
    [{ "duplicates.otherOfferId": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
