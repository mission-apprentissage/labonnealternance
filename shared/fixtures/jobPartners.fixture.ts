import { ObjectId } from "bson"

import { Country } from "../constants/places"
import { JOB_STATUS_ENGLISH } from "../models"
import { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "../models/jobsPartners.model"
import { IComputedJobsPartners } from "../models/jobsPartnersComputed.model"

export function generateJobsPartnersOfferPrivate(data: Partial<IJobsPartnersOfferPrivate> = {}): IJobsPartnersOfferPrivate {
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
    workplace_address_country: Country.FRANCE,
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
    partner_job_id: null,

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
    offer_access_conditions: [],
    offer_creation: null,
    offer_expiration: null,
    offer_opening_count: 1,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,

    apply_email: null,
    offer_multicast: true,
    offer_origin: null,

    created_at: new Date("2021-01-28T15:00:00.000Z"),
    updated_at: new Date("2021-01-28T15:00:00.000Z"),

    ...data,
  }
}

export function generateComputedJobsPartnersFixture(data: Partial<IComputedJobsPartners> = {}): IComputedJobsPartners {
  return {
    errors: [],
    validated: false,
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
    workplace_address_country: Country.FRANCE,
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
    partner_job_id: null,

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
    offer_access_conditions: [],
    offer_creation: null,
    offer_expiration: null,
    offer_opening_count: 1,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,

    apply_email: null,
    offer_multicast: true,
    offer_origin: null,

    created_at: new Date("2021-01-28T15:00:00.000Z"),
    updated_at: new Date("2021-01-28T15:00:00.000Z"),

    ...data,
  }
}
