import { ObjectId } from "bson"
import { describe, expectTypeOf, it } from "vitest"

import { OPCOS_LABEL, TRAINING_REMOTE_TYPE } from "../constants/recruteur.js"

import { JOB_STATUS_ENGLISH } from "./job.model.js"
import { IJobsPartnersOfferApi, IJobsPartnersRecruiterApi } from "./jobsPartners.model.js"

type IJobWorkplaceExpected = {
  workplace_siret: string | null
  workplace_brand: string | null
  workplace_legal_name: string | null
  workplace_website: string | null
  workplace_name: string | null
  workplace_description: string | null
  workplace_size: string | null
  workplace_address_label: string
  workplace_geopoint: {
    type: "Point"
    coordinates: [number, number]
  }
  workplace_idcc: number | null
  workplace_opco: OPCOS_LABEL | null
  workplace_naf_code: string | null
  workplace_naf_label: string | null
}

type IJobApplyExpected = {
  apply_url: string
  apply_phone: string | null
}

type IJobRecruiterExpected = IJobWorkplaceExpected &
  IJobApplyExpected & {
    _id: ObjectId
  }

type IJobOfferExpected = IJobWorkplaceExpected &
  IJobApplyExpected & {
    _id: ObjectId | string | null
    partner_label: string
    partner_job_id: string | null

    contract_start: Date | null
    contract_duration: number | null
    contract_type: Array<"Apprentissage" | "Professionnalisation">
    contract_remote: TRAINING_REMOTE_TYPE | null

    offer_title: string
    offer_rome_codes: string[]
    offer_description: string
    offer_target_diploma: {
      european: "3" | "4" | "5" | "6" | "7"
      label: string
    } | null
    offer_desired_skills: string[]
    offer_to_be_acquired_skills: string[]
    offer_access_conditions: string[]
    offer_creation: Date | null
    offer_expiration: Date | null
    offer_opening_count: number
    offer_status: JOB_STATUS_ENGLISH
  }

describe("IJobRecruiterExpected", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobRecruiterExpected>().toMatchTypeOf<IJobsPartnersRecruiterApi>()
  })
})

describe("IJobsPartnersOfferApi", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobsPartnersOfferApi>().toMatchTypeOf<IJobOfferExpected>()
  })
})
