import { z } from "zod"

import {
  ZJobsPartnersOfferApi,
  ZJobsPartnersPostApiBodyBase,
  ZJobsPartnersRecruiterApi,
  ZJobsPartnersWritableApi,
  type IJobsPartnersOfferApi,
  type IJobsPartnersRecruiterApi,
  type IJobsPartnersWritableApi,
  type IJobsPartnersWritableApiInput,
} from "../../../models/jobsPartners.model"
import type { IJobsOpportunityResponse } from "../../jobOpportunity.routes"

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

export const zJobSearchApiV3 = z.object({
  jobs: zJobOfferApiReadV3.array(),
  recruiters: zJobRecruiterApiReadV3.array(),
  warnings: z.array(z.object({ message: z.string(), code: z.string() })),
})

export type IJobSearchApiV3 = z.output<typeof zJobSearchApiV3>

export const zJobOfferApiWriteV3 = z
  .object({
    identifier: z.object({
      partner_job_id: ZJobsPartnersPostApiBodyBase.shape.partner_job_id,
    }),
    contract: z.object({
      start: ZJobsPartnersPostApiBodyBase.shape.contract_start,
      duration: ZJobsPartnersPostApiBodyBase.shape.contract_duration,
      type: ZJobsPartnersPostApiBodyBase.shape.contract_type,
      remote: ZJobsPartnersPostApiBodyBase.shape.contract_remote,
    }),
    offer: z
      .object({
        title: ZJobsPartnersPostApiBodyBase.shape.offer_title,
        rome_codes: ZJobsPartnersPostApiBodyBase.shape.offer_rome_codes,
        description: ZJobsPartnersPostApiBodyBase.shape.offer_description,
        target_diploma: z
          .object({
            european: ZJobsPartnersPostApiBodyBase.shape.offer_target_diploma_european,
          })
          .nullable()
          .default(null),
        desired_skills: ZJobsPartnersPostApiBodyBase.shape.offer_desired_skills,
        to_be_acquired_skills: ZJobsPartnersPostApiBodyBase.shape.offer_to_be_acquired_skills,
        access_conditions: ZJobsPartnersPostApiBodyBase.shape.offer_access_conditions,
        publication: z
          .object({
            creation: ZJobsPartnersPostApiBodyBase.shape.offer_creation,
            expiration: ZJobsPartnersPostApiBodyBase.shape.offer_expiration,
          })
          .partial(),
        opening_count: ZJobsPartnersPostApiBodyBase.shape.offer_opening_count,
        origin: ZJobsPartnersPostApiBodyBase.shape.offer_origin,
        multicast: ZJobsPartnersPostApiBodyBase.shape.offer_multicast,
      })
      .partial()
      .required({
        title: true,
        description: true,
      }),
    apply: z
      .object({
        email: ZJobsPartnersPostApiBodyBase.shape.apply_email,
        phone: ZJobsPartnersPostApiBodyBase.shape.apply_phone,
        url: ZJobsPartnersPostApiBodyBase.shape.apply_url,
      })
      .partial()
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
    workplace: z
      .object({
        siret: ZJobsPartnersPostApiBodyBase.shape.workplace_siret,
        name: ZJobsPartnersPostApiBodyBase.shape.workplace_name,
        website: ZJobsPartnersPostApiBodyBase.shape.workplace_website,
        description: ZJobsPartnersPostApiBodyBase.shape.workplace_description,
        location: z
          .object({
            address: ZJobsPartnersPostApiBodyBase.shape.workplace_address_label,
          })
          .nullish(),
      })
      .partial()
      .required({ siret: true }),
  })
  .partial({
    identifier: true,
    contract: true,
  })

export type IJobOfferApiWriteV3 = z.output<typeof zJobOfferApiWriteV3>

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
  }
}

function convertToJobRecruiterApiReadV3(input: IJobsPartnersRecruiterApi): IJobRecruiterApiReadV3 {
  return {
    identifier: {
      id: input._id,
    },
    workplace: convertToJobWorkplaceReadV3(input),
    apply: convertToJobApplyReadV3(input),
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

function convertToJobSearchApiV3(input: IJobsOpportunityResponse): IJobSearchApiV3 {
  return {
    jobs: input.jobs.map(convertToJobOfferApiReadV3),
    recruiters: input.recruiters.map(convertToJobRecruiterApiReadV3),
    warnings: input.warnings,
  }
}

function convertToJobsPartnersWritableApi(jobOffer: IJobOfferApiWriteV3): IJobsPartnersWritableApi {
  const result: IJobsPartnersWritableApiInput = {
    offer_title: jobOffer.offer.title,
    offer_description: jobOffer.offer.description,
    workplace_siret: jobOffer.workplace.siret,
  }

  if (jobOffer.identifier) {
    if (jobOffer.identifier.partner_job_id != null) {
      result.partner_job_id = jobOffer.identifier.partner_job_id
    }
  }

  if (jobOffer.workplace.name != null) {
    result.workplace_name = jobOffer.workplace.name
  }
  if (jobOffer.workplace.description != null) {
    result.workplace_description = jobOffer.workplace.description
  }
  if (jobOffer.workplace.website != null) {
    result.workplace_website = jobOffer.workplace.website
  }
  if (jobOffer.workplace.location != null) {
    result.workplace_address_label = jobOffer.workplace.location.address
  }

  if (jobOffer.apply.url != null) {
    result.apply_url = jobOffer.apply.url
  }
  if (jobOffer.apply.phone != null) {
    result.apply_phone = jobOffer.apply.phone
  }
  if (jobOffer.apply.email != null) {
    result.apply_email = jobOffer.apply.email
  }

  if (jobOffer.contract) {
    if (jobOffer.contract.start != null) {
      result.contract_start = jobOffer.contract.start.toJSON()
    }
    if (jobOffer.contract.duration != null) {
      result.contract_duration = jobOffer.contract.duration
    }
    if (jobOffer.contract.type != null) {
      result.contract_type = jobOffer.contract.type
    }
    if (jobOffer.contract.remote != null) {
      result.contract_remote = jobOffer.contract.remote
    }
  }

  if (jobOffer.offer) {
    if (jobOffer.offer.rome_codes != null) {
      result.offer_rome_codes = jobOffer.offer.rome_codes
    }
    if (jobOffer.offer.target_diploma != null) {
      result.offer_target_diploma_european = jobOffer.offer.target_diploma != null ? jobOffer.offer.target_diploma.european : null
    }
    if (jobOffer.offer.desired_skills != null) {
      result.offer_desired_skills = jobOffer.offer.desired_skills
    }
    if (jobOffer.offer.to_be_acquired_skills != null) {
      result.offer_to_be_acquired_skills = jobOffer.offer.to_be_acquired_skills
    }
    if (jobOffer.offer.access_conditions != null) {
      result.offer_access_conditions = jobOffer.offer.access_conditions
    }
    if (jobOffer.offer.publication != null) {
      if (jobOffer.offer.publication.creation != null) {
        result.offer_creation = jobOffer.offer.publication.creation.toJSON()
      }
      if (jobOffer.offer.publication.expiration != null) {
        result.offer_expiration = jobOffer.offer.publication.expiration.toJSON()
      }
    }
    if (jobOffer.offer.opening_count != null) {
      result.offer_opening_count = jobOffer.offer.opening_count
    }
    if (jobOffer.offer.multicast != null) {
      result.offer_multicast = jobOffer.offer.multicast
    }
    if (jobOffer.offer.origin != null) {
      result.offer_origin = jobOffer.offer.origin
    }
    // TODO: offer_status to be implemented
    // if (jobOffer.offer.status != null) {
    //   result.offer_status = jobOffer.offer.status;
    // }
  }

  return ZJobsPartnersWritableApi.parse(result)
}

export const jobsRouteApiv3Converters = {
  convertToJobSearchApiV3,
  convertToJobsPartnersWritableApi,
}
