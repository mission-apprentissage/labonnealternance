import { ObjectId } from "mongodb"
import { describe, expectTypeOf, it } from "vitest"

import { OPCOS_LABEL, TRAINING_REMOTE_TYPE } from "../constants/recruteur.js"

import { JOB_STATUS_ENGLISH } from "./job.model.js"
import { IJobsPartnersOfferApi, IJobsPartnersOfferHistoryEvent, IJobsPartnersRecruiterApi, IJobsPartnersWritableApi, IJobsPartnersWritableApiInput } from "./jobsPartners.model.js"

type IJobWorkplaceApiExpected = {
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
  is_delegated: boolean
  cfa_legal_name: string | null
  cfa_siret: string | null
  cfa_address_label: string | null
}

type IJobApplyExpected = {
  apply_url: string
  apply_phone: string | null
}

type IJobRecruiterExpected = IJobWorkplaceApiExpected &
  IJobApplyExpected & {
    _id: ObjectId
  }

type IJobOfferApiExpected = IJobWorkplaceApiExpected &
  IJobApplyExpected & {
    _id: ObjectId | string | null
    partner_label: string
    partner_job_id: string

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
    contract_rythm: string | null | undefined
    contract_is_disabled_elligible: boolean | null
    offer_to_be_acquired_knowledge: string[] | null | undefined
    apply_recipient_id: string | null | undefined
    offer_status_history: IJobsPartnersOfferHistoryEvent[]
    stats_detail_view: number
    stats_search_view: number
    stats_postuler: number
  }

type IJobOfferApiWritableExpected = {
  contract_duration: IJobOfferApiExpected["contract_duration"]
  contract_type: IJobOfferApiExpected["contract_type"]
  contract_remote: IJobOfferApiExpected["contract_remote"] | undefined
  contract_start: Date | null

  offer_title: string
  offer_rome_codes: string[] | null
  offer_description: string
  offer_target_diploma_european: "3" | "4" | "5" | "6" | "7" | null
  offer_desired_skills: IJobOfferApiExpected["offer_desired_skills"]
  offer_to_be_acquired_skills: IJobOfferApiExpected["offer_to_be_acquired_skills"]
  offer_access_conditions: IJobOfferApiExpected["offer_access_conditions"]
  offer_creation: IJobOfferApiExpected["offer_creation"]
  offer_expiration: IJobOfferApiExpected["offer_expiration"]
  offer_opening_count: IJobOfferApiExpected["offer_opening_count"]
  offer_origin: string | null
  offer_multicast: boolean

  apply_url: string | null
  apply_phone: string | null
  apply_email: string | null

  workplace_siret: string
  workplace_name: string | null
  workplace_website: string | null
  workplace_description: string | null
  workplace_address_label: string | null
}

type IJobOfferWritableInputExpected = {
  contract_duration?: number | null | undefined
  contract_type?: Array<"Apprentissage" | "Professionnalisation"> | undefined
  contract_remote?: IJobOfferApiExpected["contract_remote"] | undefined
  contract_start?: string | null | undefined

  offer_title: string
  offer_rome_codes?: string[] | null | undefined
  offer_description: string
  offer_target_diploma_european?: "3" | "4" | "5" | "6" | "7" | null | undefined
  offer_desired_skills?: string[] | undefined
  offer_to_be_acquired_skills?: string[] | undefined
  offer_access_conditions?: string[] | undefined
  offer_creation?: string | null | undefined
  offer_expiration?: string | null | undefined
  offer_opening_count?: number | undefined
  offer_origin?: string | null | undefined
  offer_multicast?: boolean | undefined
  offer_status?: JOB_STATUS_ENGLISH | undefined

  apply_url?: string | null | undefined
  apply_phone?: string | null | undefined
  apply_email?: string | null | undefined

  workplace_siret: string
  workplace_name?: string | null | undefined
  workplace_website?: string | null | undefined
  workplace_description?: string | null | undefined
  workplace_address_label?: string | null | undefined
}

describe("IJobRecruiterExpected", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobRecruiterExpected>().toMatchTypeOf<IJobsPartnersRecruiterApi>()
  })
})

describe("IJobsPartnersOfferApi", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobsPartnersOfferApi>().toMatchTypeOf<IJobOfferApiExpected>()
  })
})

describe("IJobsPartnersWritableApi", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobsPartnersWritableApi>().toMatchTypeOf<IJobOfferApiWritableExpected>()
  })
})

describe("IJobsPartnersWritableApiInput", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobsPartnersWritableApiInput>().toEqualTypeOf<IJobOfferWritableInputExpected>()
  })
})
