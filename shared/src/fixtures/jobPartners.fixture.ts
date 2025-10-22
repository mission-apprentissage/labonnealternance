import { ObjectId } from "bson"

import { OPCOS_LABEL, TRAINING_REMOTE_TYPE } from "../constants/recruteur.js"
import { JOB_STATUS_ENGLISH } from "../models/job.model.js"
import { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "../models/jobsPartners.model.js"
import { IComputedJobsPartners } from "../models/jobsPartnersComputed.model.js"

export function generateJobsPartnersOfferPrivate(data: Partial<IJobsPartnersOfferPrivate> = {}): IJobsPartnersOfferPrivate {
  const offer_expiration = new Date("2050-01-01")
  return {
    _id: new ObjectId(),
    workplace_siret: null,
    workplace_website: null,
    workplace_name: null,
    workplace_brand: null,
    workplace_legal_name: null,
    workplace_description: null,
    workplace_size: null,
    workplace_address_city: "PARIS",
    workplace_address_zipcode: "75007",
    workplace_address_label: "126 RUE DE L'UNIVERSITE 75007 PARIS",
    workplace_address_street_label: "126 RUE DE L'UNIVERSITE",
    workplace_geopoint: {
      coordinates: [0, 0],
      type: "Point",
    },
    workplace_idcc: null,
    workplace_opco: null,
    workplace_naf_code: null,
    workplace_naf_label: null,

    apply_url: "https://apply.com",
    apply_phone: null,
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    partner_job_id: new ObjectId().toString(),

    contract_start: null,
    contract_duration: null,
    contract_type: ["Apprentissage", "Professionnalisation"],
    contract_remote: null,
    contract_is_disabled_elligible: false,

    offer_title: "Une super offre d'alternance",
    offer_rome_codes: [],
    offer_description: "Attention il te faut une super motivation pour ce job",
    offer_target_diploma: null,
    offer_desired_skills: [],
    offer_to_be_acquired_skills: [],
    offer_to_be_acquired_knowledge: [],
    offer_access_conditions: [],
    offer_creation: null,
    offer_expiration,
    offer_opening_count: 1,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,

    apply_email: null,
    offer_multicast: true,
    offer_origin: null,

    created_at: new Date("2021-01-28T15:00:00.000Z"),
    updated_at: new Date("2021-01-28T15:00:00.000Z"),
    offer_status_history: [],

    stats_detail_view: 0,
    stats_postuler: 0,
    stats_search_view: 0,

    cfa_siret: null,
    cfa_legal_name: null,
    cfa_apply_phone: null,
    cfa_apply_email: null,
    cfa_address_label: null,
    job_status_comment: null,
    job_delegation_count: null,
    delegations: null,
    is_delegated: false,
    lba_url: "",

    ...data,
  }
}

export function generateJobsPartnersFull(data: Partial<IJobsPartnersOfferPrivate> = {}): IJobsPartnersOfferPrivate {
  return {
    _id: new ObjectId(),
    workplace_siret: "13002526500013",
    workplace_website: "http://workplace_website.com",
    workplace_name: "workplace_name",
    workplace_brand: "workplace_brand",
    workplace_legal_name: "workplace_legal_name",
    workplace_description: "workplace_description",
    workplace_size: "0-50",
    workplace_address_city: "PARIS",
    workplace_address_zipcode: "75007",
    workplace_address_label: "126 RUE DE L'UNIVERSITE 75007 PARIS",
    workplace_address_street_label: "126 RUE DE L'UNIVERSITE",
    workplace_geopoint: {
      coordinates: [0, 0],
      type: "Point",
    },
    workplace_idcc: 1003,
    workplace_opco: OPCOS_LABEL.ATLAS,
    workplace_naf_code: "6201Z",
    workplace_naf_label: "Programmation informatique",

    apply_url: "https://apply.com",
    apply_phone: "0123456789",
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    partner_job_id: new ObjectId().toString(),

    contract_start: new Date("2021-01-28T15:00:00.000Z"),
    contract_duration: 6,
    contract_type: ["Apprentissage", "Professionnalisation"],
    contract_remote: TRAINING_REMOTE_TYPE.onsite,
    contract_is_disabled_elligible: false,

    offer_title: "Une super offre d'alternance",
    offer_rome_codes: ["D1102"],
    offer_description: "Attention il te faut une super motivation pour ce job",
    offer_target_diploma: {
      european: "3",
      label: "Master",
    },
    offer_desired_skills: ["offer_desired_skills"],
    offer_to_be_acquired_skills: ["offer_to_be_acquired_skills"],
    offer_access_conditions: ["offer_access_conditions"],
    offer_creation: new Date("2021-01-28T15:00:00.000Z"),
    offer_expiration: new Date("2050-01-01"),
    offer_opening_count: 1,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,

    apply_email: "email@email.fr",
    offer_multicast: true,
    offer_origin: "origin",

    created_at: new Date("2021-01-28T15:00:00.000Z"),
    updated_at: new Date("2021-01-28T15:00:00.000Z"),
    offer_status_history: [],

    stats_detail_view: 0,
    stats_postuler: 0,
    stats_search_view: 0,

    cfa_siret: null,
    cfa_legal_name: null,
    cfa_apply_phone: null,
    cfa_apply_email: null,
    cfa_address_label: null,
    job_status_comment: null,
    job_delegation_count: null,
    delegations: null,
    is_delegated: false,
    lba_url: "",

    ...data,
  }
}

export function generateComputedJobsPartnersFixture(data: Partial<IComputedJobsPartners> = {}): IComputedJobsPartners {
  return {
    errors: [],
    validated: false,
    business_error: null,
    jobs_in_success: [],

    _id: new ObjectId(),
    workplace_siret: null,
    workplace_website: null,
    workplace_name: null,
    workplace_brand: null,
    workplace_legal_name: null,
    workplace_description: null,
    workplace_size: null,
    workplace_address_city: "PARIS",
    workplace_address_zipcode: "75007",
    workplace_address_label: "126 RUE DE L'UNIVERSITE 75007 PARIS",
    workplace_address_street_label: "126 RUE DE L'UNIVERSITE",
    workplace_geopoint: {
      coordinates: [0, 0],
      type: "Point",
    },
    workplace_idcc: null,
    workplace_opco: null,
    workplace_naf_code: null,
    workplace_naf_label: null,

    apply_url: "https://apply.com",
    apply_phone: null,
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    partner_job_id: "partner_job_id",

    contract_start: null,
    contract_duration: null,
    contract_type: ["Apprentissage", "Professionnalisation"],
    contract_remote: null,

    offer_title: "Une super offre d'alternance",
    offer_rome_codes: [],
    offer_description: "Attention il te faut une super motivation pour ce job",
    offer_target_diploma: null,
    offer_desired_skills: [],
    offer_to_be_acquired_skills: [],
    offer_to_be_acquired_knowledge: [],
    offer_access_conditions: [],
    offer_creation: null,
    offer_expiration: null,
    offer_opening_count: 1,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,

    apply_email: null,
    offer_multicast: true,
    offer_origin: null,
    lba_url: null,

    created_at: new Date("2021-01-28T15:00:00.000Z"),
    updated_at: new Date("2021-01-28T15:00:00.000Z"),
    ...data,
  }
}
