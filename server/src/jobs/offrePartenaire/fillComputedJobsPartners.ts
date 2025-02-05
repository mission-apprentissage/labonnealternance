import { Filter } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { detectDuplicateJobPartners } from "./detectDuplicateJobPartners"
import { fillLocationInfosForPartners } from "./fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { fillRomeForPartners } from "./fillRomeForPartners"
import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"
import { rankJobPartners } from "./rankJobPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

export const fillComputedJobsPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  await fillOpcoInfosForPartners(addedMatchFilter)
  await fillSiretInfosForPartners(addedMatchFilter)
  await fillLocationInfosForPartners(addedMatchFilter)
  await fillRomeForPartners(addedMatchFilter)
  await rankJobPartners(addedMatchFilter)
  await detectDuplicateJobPartners(addedMatchFilter)
  await validateComputedJobPartners(addedMatchFilter)
}

export const blankComputedJobPartner: Omit<IComputedJobsPartners, "_id" | "partner_label" | "partner_job_id"> = {
  apply_phone: null,
  apply_url: null,
  business_error: null,
  contract_duration: null,
  contract_remote: null,
  contract_start: null,
  contract_type: [],
  created_at: null,
  errors: [],
  offer_access_conditions: [],
  offer_creation: null,
  offer_description: null,
  offer_desired_skills: [],
  offer_expiration: null,
  offer_multicast: false,
  offer_opening_count: 1,
  offer_origin: null,
  offer_rome_codes: null,
  offer_status: JOB_STATUS_ENGLISH.ACTIVE,
  offer_target_diploma: null,
  offer_title: null,
  offer_to_be_acquired_skills: [],
  updated_at: null,
  validated: false,
  workplace_address_city: null,
  workplace_address_label: null,
  workplace_address_street_label: null,
  workplace_address_zipcode: null,
  workplace_brand: null,
  workplace_description: null,
  workplace_geopoint: null,
  workplace_idcc: null,
  workplace_legal_name: null,
  workplace_name: null,
  workplace_naf_code: null,
  workplace_naf_label: null,
  workplace_opco: null,
  workplace_siret: null,
  workplace_size: null,
  workplace_website: null,
  jobs_in_success: [],
}
