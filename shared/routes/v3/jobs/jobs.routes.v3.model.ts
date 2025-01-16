import { z } from "zod"

import { TRAINING_CONTRACT_TYPE } from "../../../constants"
import { extensions } from "../../../helpers/zodHelpers/zodPrimitives"
import { JOB_STATUS_ENGLISH } from "../../../models"
import {
  FILTER_JOBPARTNERS_LABEL,
  zDiplomaEuropeanLevel,
  ZJobsPartnersOfferApi,
  ZJobsPartnersOfferPrivate,
  ZJobsPartnersRecruiterApi,
  type IJobsPartnersOfferApi,
  type IJobsPartnersRecruiterApi,
} from "../../../models/jobsPartners.model"

const TIME_CLOCK_TOLERANCE = 300_000

export const zJobRecruiterApiReadV3 = z.object({
  identifier: z.object({
    id: ZJobsPartnersRecruiterApi.shape._id,
  }),
  workplace: z.object({
    siret: ZJobsPartnersRecruiterApi.shape.workplace_siret,
    brand: ZJobsPartnersRecruiterApi.shape.workplace_brand,
    legal_name: ZJobsPartnersRecruiterApi.shape.workplace_legal_name,
    website: ZJobsPartnersRecruiterApi.shape.workplace_website,
    name: ZJobsPartnersRecruiterApi.shape.workplace_name,
    description: ZJobsPartnersRecruiterApi.shape.workplace_description,
    size: ZJobsPartnersRecruiterApi.shape.workplace_size,
    location: z.object({
      address: ZJobsPartnersRecruiterApi.shape.workplace_address_label,
      geopoint: ZJobsPartnersRecruiterApi.shape.workplace_geopoint,
    }),
    domain: z.object({
      idcc: ZJobsPartnersRecruiterApi.shape.workplace_idcc,
      opco: ZJobsPartnersRecruiterApi.shape.workplace_opco,
      naf: z
        .object({
          code: ZJobsPartnersRecruiterApi.shape.workplace_naf_code.unwrap(),
          label: ZJobsPartnersRecruiterApi.shape.workplace_naf_label,
        })
        .nullable(),
    }),
  }),
  apply: z.object({
    url: ZJobsPartnersRecruiterApi.shape.apply_url,
    phone: ZJobsPartnersRecruiterApi.shape.apply_phone,
    recipient_id: ZJobsPartnersRecruiterApi.shape.apply_recipient_id,
  }),
})

export type IJobRecruiterApiReadV3 = z.output<typeof zJobRecruiterApiReadV3>

export const zJobOfferApiReadV3 = z.object({
  identifier: z.object({
    id: ZJobsPartnersOfferApi.shape._id,
    partner_label: ZJobsPartnersOfferApi.shape.partner_label,
    partner_job_id: ZJobsPartnersOfferApi.shape.partner_job_id,
  }),
  workplace: zJobRecruiterApiReadV3.shape.workplace,
  apply: zJobRecruiterApiReadV3.shape.apply,
  contract: z.object({
    start: ZJobsPartnersOfferApi.shape.contract_start,
    duration: ZJobsPartnersOfferApi.shape.contract_duration,
    type: ZJobsPartnersOfferApi.shape.contract_type,
    remote: ZJobsPartnersOfferApi.shape.contract_remote,
  }),
  offer: z.object({
    title: ZJobsPartnersOfferApi.shape.offer_title,
    rome_codes: ZJobsPartnersOfferApi.shape.offer_rome_codes,
    description: ZJobsPartnersOfferApi.shape.offer_description,
    target_diploma: ZJobsPartnersOfferApi.shape.offer_target_diploma,
    desired_skills: ZJobsPartnersOfferApi.shape.offer_desired_skills,
    to_be_acquired_skills: ZJobsPartnersOfferApi.shape.offer_to_be_acquired_skills,
    access_conditions: ZJobsPartnersOfferApi.shape.offer_access_conditions,
    publication: z.object({
      creation: ZJobsPartnersOfferApi.shape.offer_creation,
      expiration: ZJobsPartnersOfferApi.shape.offer_expiration,
    }),
    opening_count: ZJobsPartnersOfferApi.shape.offer_opening_count,
    status: ZJobsPartnersOfferApi.shape.offer_status,
  }),
})

export type IJobOfferApiReadV3 = z.output<typeof zJobOfferApiReadV3>

export const zJobSearchApiV3Response = z.object({
  jobs: zJobOfferApiReadV3.array(),
  recruiters: zJobRecruiterApiReadV3.array(),
  warnings: z.array(z.object({ message: z.string(), code: z.string() })),
})

export const zJobSearchApiV3Query = z
  .object({
    latitude: extensions.latitude({ coerce: true }).nullable().default(null),
    longitude: extensions.longitude({ coerce: true }).nullable().default(null),
    radius: z.coerce.number().min(0).max(200).default(30),
    target_diploma_level: zDiplomaEuropeanLevel.optional(),
    romes: extensions.romeCodeArray().nullable().default(null),
    rncp: extensions.rncpCode().nullable().default(null),
    partners_to_exclude: z.array(extensions.buildEnum(FILTER_JOBPARTNERS_LABEL)).nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.longitude == null && data.latitude != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["longitude"],
        message: "longitude is required when latitude is provided",
      })
    }

    if (data.longitude != null && data.latitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latitude"],
        message: "latitude is required when longitude is provided",
      })
    }
  })

export type IJobSearchApiV3Response = z.output<typeof zJobSearchApiV3Response>
export type IJobSearchApiV3Query = z.output<typeof zJobSearchApiV3Query>
export type IJobSearchApiV3QueryResolved = Omit<IJobSearchApiV3Query, "latitude" | "longitude" | "radius" | "rncp"> & {
  geo: { latitude: number; longitude: number; radius: number } | null
}

export const zJobOfferApiWriteV3 = z.object({
  contract: z
    .object({
      start: z
        .string({ message: "Expected ISO 8601 date string" })
        .datetime({ offset: true, message: "Expected ISO 8601 date string" })
        .pipe(z.coerce.date())
        .nullable()
        .default(null),
      duration: ZJobsPartnersOfferPrivate.shape.contract_duration.default(null),
      type: ZJobsPartnersOfferPrivate.shape.contract_type.default([TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]),
      remote: ZJobsPartnersOfferPrivate.shape.contract_remote.default(null),
    })
    .default({}),
  offer: z.object({
    title: ZJobsPartnersOfferPrivate.shape.offer_title,
    rome_codes: ZJobsPartnersOfferPrivate.shape.offer_rome_codes.nullable().default(null),
    description: ZJobsPartnersOfferPrivate.shape.offer_description.min(30, "Job description should be at least 30 characters"),
    target_diploma: z
      .object({
        european: zDiplomaEuropeanLevel.nullable().default(null),
      })
      .nullable()
      .default(null),
    desired_skills: ZJobsPartnersOfferPrivate.shape.offer_desired_skills.default([]),
    to_be_acquired_skills: ZJobsPartnersOfferPrivate.shape.offer_to_be_acquired_skills.default([]),
    access_conditions: ZJobsPartnersOfferPrivate.shape.offer_access_conditions.default([]),
    publication: z
      .object({
        creation: z
          .string({ message: "Expected ISO 8601 date string" })
          .datetime({ offset: true, message: "Expected ISO 8601 date string" })
          .pipe(
            z.coerce.date().refine((value) => value.getTime() < Date.now() + TIME_CLOCK_TOLERANCE, {
              message: "Creation date cannot be in the future",
            })
          )
          .nullable()
          .default(null),
        expiration: z
          .string({ message: "Expected ISO 8601 date string" })
          .datetime({ offset: true, message: "Expected ISO 8601 date string" })
          .pipe(
            z.coerce.date().refine((value) => value === null || value.getTime() > Date.now() - TIME_CLOCK_TOLERANCE, {
              message: "Expiration date cannot be in the past",
            })
          )
          .nullable()
          .default(null),
      })
      .default({}),
    opening_count: ZJobsPartnersOfferPrivate.shape.offer_opening_count.default(1),
    origin: ZJobsPartnersOfferPrivate.shape.offer_origin,
    multicast: ZJobsPartnersOfferPrivate.shape.offer_multicast,
    status: ZJobsPartnersOfferPrivate.shape.offer_status.default(JOB_STATUS_ENGLISH.ACTIVE),
  }),
  apply: z
    .object({
      email: ZJobsPartnersOfferPrivate.shape.apply_email,
      phone: extensions.telephone.nullable().describe("Téléphone de contact").default(null),
      url: ZJobsPartnersOfferApi.shape.apply_url.nullable().default(null),
    })
    .required()
    .superRefine((data, ctx) => {
      const keys = ["url", "email", "phone"] as const
      if (keys.every((key) => data[key] == null)) {
        keys.forEach((key) => {
          ctx.addIssue({
            code: "custom",
            message: "At least one of url, email, or phone is required",
            path: [key],
          })
        })
      }

      return data
    }),
  workplace: z.object({
    siret: extensions.siret,
    name: ZJobsPartnersOfferPrivate.shape.workplace_name.default(null),
    website: ZJobsPartnersOfferPrivate.shape.workplace_website.default(null),
    description: ZJobsPartnersOfferPrivate.shape.workplace_description.default(null),
    location: z
      .object({
        address: z.string().nullable().default(null),
      })
      .nullable()
      .default({}),
  }),
})

export type IJobOfferApiWriteV3 = z.output<typeof zJobOfferApiWriteV3>
export type IJobOfferApiWriteV3Input = z.input<typeof zJobOfferApiWriteV3>

function convertToJobWorkplaceReadV3(input: IJobsPartnersOfferApi | IJobsPartnersRecruiterApi): IJobRecruiterApiReadV3["workplace"] {
  return {
    siret: input.workplace_siret,
    brand: input.workplace_brand,
    legal_name: input.workplace_legal_name,
    website: input.workplace_website,
    name: input.workplace_name,
    description: input.workplace_description,
    size: input.workplace_size,
    location: {
      address: input.workplace_address_label,
      geopoint: input.workplace_geopoint,
    },
    domain: {
      idcc: input.workplace_idcc,
      opco: input.workplace_opco,
      naf: input.workplace_naf_code === null ? null : { code: input.workplace_naf_code, label: input.workplace_naf_label },
    },
  }
}

function convertToJobApplyReadV3(input: IJobsPartnersOfferApi | IJobsPartnersRecruiterApi): IJobRecruiterApiReadV3["apply"] {
  return {
    url: input.apply_url,
    phone: input.apply_phone,
    recipient_id: input.apply_recipient_id || null,
  }
}

function convertToJobOfferApiReadV3(input: IJobsPartnersOfferApi): IJobOfferApiReadV3 {
  return {
    identifier: {
      id: input._id,
      partner_label: input.partner_label,
      partner_job_id: input.partner_job_id,
    },

    workplace: convertToJobWorkplaceReadV3(input),
    apply: convertToJobApplyReadV3(input),

    contract: {
      start: input.contract_start,
      duration: input.contract_duration,
      type: input.contract_type,
      remote: input.contract_remote,
    },

    offer: {
      title: input.offer_title,
      rome_codes: input.offer_rome_codes,
      description: input.offer_description,
      target_diploma: input.offer_target_diploma,
      desired_skills: input.offer_desired_skills,
      to_be_acquired_skills: input.offer_to_be_acquired_skills,
      access_conditions: input.offer_access_conditions,
      publication: {
        creation: input.offer_creation,
        expiration: input.offer_expiration,
      },
      opening_count: input.offer_opening_count,
      status: input.offer_status,
    },
  }
}

export const jobsRouteApiv3Converters = {
  convertToJobOfferApiReadV3,
}
