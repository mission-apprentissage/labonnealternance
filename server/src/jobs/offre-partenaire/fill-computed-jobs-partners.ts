import type { Filter } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { type IComputedJobsPartners, JOBS_PARTNERS_OFFER_ORIGIN } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { blockJobsPartnersFromExpirationDate } from "@/jobs/offre-partenaire/block-jobs-partners-from-expiration-date"
import { blockJobsPartnersFromFluxCompanyList } from "@/jobs/offre-partenaire/block-jobs-partners-from-flux-company-list"
import { blockBadRomeJobsPartners } from "./block-bad-rome-jobs-partners"
import { blockJobsPartnersFromCfaList } from "./block-jobs-partners-from-cfa-list"
import { blockJobsPartnersWithNaf85 } from "./block-jobs-partners-with-naf85"
import { detectClassificationJobsPartners } from "./detect-classification-jobs-partners"
import { detectDuplicateJobPartners } from "./detect-duplicate-job-partners"
import { fillEntrepriseEngagementComputedJobsPartners } from "./fill-entreprise-engagement-computed-jobs-partners"
import { fillLocationInfosForPartners } from "./fill-location-infos-for-partners"
import { fillOpcoInfosForPartners } from "./fill-opco-infos-for-partners"
import { fillRomeForPartners } from "./fill-rome-for-partners"
import { fillSiretInfosForPartners } from "./fill-siret-infos-for-partners"
import { formatTextFieldsJobsPartners } from "./format-text-fields-jobs-partners"
import { rankJobPartners } from "./rank-job-partners"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

export type FillComputedJobsPartnersContext = {
  addedMatchFilter?: Filter<IComputedJobsPartners>
  skipCfaAndClassificationDetection?: boolean
}

export const defaultFillComputedJobsPartnersContext: FillComputedJobsPartnersContext = {}

export const fillComputedJobsPartners = async (partialContext: Partial<FillComputedJobsPartnersContext> = {}) => {
  logger.info("début de fillComputedJobsPartners")
  const context: FillComputedJobsPartnersContext = { ...defaultFillComputedJobsPartnersContext, ...partialContext }

  const steps = {
    blockJobsPartnersFromFluxCompanyList: await blockJobsPartnersFromFluxCompanyList(context),
    blockJobsPartnersFromExpirationDate: await blockJobsPartnersFromExpirationDate(context),
    fillEntrepriseEngagementComputedJobsPartners: await fillEntrepriseEngagementComputedJobsPartners(context),
    formatTextFieldsJobsPartners: await formatTextFieldsJobsPartners(context),
    blockJobsPartnersFromCfaList: context.skipCfaAndClassificationDetection ? null : await blockJobsPartnersFromCfaList(context),
    detectClassificationJobsPartners: context.skipCfaAndClassificationDetection ? null : await detectClassificationJobsPartners(context),

    fillOpcoInfosForPartners: await fillOpcoInfosForPartners(context),
    fillSiretInfosForPartners: await fillSiretInfosForPartners(context),
    blockJobsPartnersWithNaf85: await blockJobsPartnersWithNaf85(context),
    fillLocationInfosForPartners: await fillLocationInfosForPartners(context),
    fillRomeForPartners: await fillRomeForPartners(context),
    blockBadRomeJobsPartners: await blockBadRomeJobsPartners(context),

    rankJobPartners: await rankJobPartners(context),
    detectDuplicateJobPartners: await detectDuplicateJobPartners(context),

    validateComputedJobPartners: await validateComputedJobPartners(context),
  }
  logger.info("fin de fillComputedJobsPartners")
  return steps
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
  offer_origin: JOBS_PARTNERS_OFFER_ORIGIN.FLUX,
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
