import type { Filter } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { blockBadRomeJobsPartners } from "./blockBadRomeJobsPartners"
import { blockJobsPartnersFromCfaList } from "./blockJobsPartnersFromCfaList"
import { blockJobsPartnersWithNaf85 } from "./blockJobsPartnersWithNaf85"
import { detectClassificationJobsPartners } from "./detectClassificationJobsPartners"
import { detectDuplicateJobPartners } from "./detectDuplicateJobPartners"
import { fillEntrepriseEngagementJobsPartners } from "./fillEntrepriseEngagementJobsPartners"
import { fillLocationInfosForPartners } from "./fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { fillRomeForPartners } from "./fillRomeForPartners"
import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"
import { formatTextFieldsJobsPartners } from "./formatTextFieldsJobsPartners"
import { rankJobPartners } from "./rankJobPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

import { logger } from "@/common/logger"

export type FillComputedJobsPartnersContext = {
  addedMatchFilter?: Filter<IComputedJobsPartners>
  shouldNotifySlack: boolean
}

export const defaultFillComputedJobsPartnersContext: FillComputedJobsPartnersContext = {
  shouldNotifySlack: true,
}

export const fillComputedJobsPartners = async (partialContext: Partial<FillComputedJobsPartnersContext> = {}) => {
  logger.info("début de fillComputedJobsPartners")
  const context: FillComputedJobsPartnersContext = { ...defaultFillComputedJobsPartnersContext, ...partialContext }
  await fillEntrepriseEngagementJobsPartners(context)
  await formatTextFieldsJobsPartners(context)
  await blockJobsPartnersFromCfaList(context)
  await detectClassificationJobsPartners(context)

  await fillOpcoInfosForPartners(context)
  await fillSiretInfosForPartners(context)
  await blockJobsPartnersWithNaf85(context)
  await fillLocationInfosForPartners(context)
  await fillRomeForPartners(context)
  await blockBadRomeJobsPartners(context)

  await rankJobPartners(context)
  await detectDuplicateJobPartners(context)

  await validateComputedJobPartners(context)
  logger.info("fin de fillComputedJobsPartners")
}

export const blankComputedJobPartner = (now: Date): Omit<IComputedJobsPartners, "_id" | "partner_label" | "partner_job_id"> => ({
  apply_phone: null,
  apply_url: null,
  business_error: null,
  contract_duration: null,
  contract_remote: null,
  contract_start: null,
  contract_type: [],
  contract_is_disabled_elligible: false,
  created_at: now,
  updated_at: now,
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
  offer_to_be_acquired_knowledge: [],
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
})
