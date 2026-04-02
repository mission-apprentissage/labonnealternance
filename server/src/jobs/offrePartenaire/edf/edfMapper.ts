import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { enedisJobToJobsPartnersProcessor, getXmlTextValue, type IEnedisJob } from "@/jobs/offrePartenaire/enedis/enedisMapper"

export type IEdfJob = IEnedisJob

/**
 * Build the offer_description for EDF jobs: mission description + optional LongText1Formatted.
 * Unlike Enedis, EDF descriptions do not append the applicant profile or plain-text remuneration.
 */
const buildEdfOfferDescription = (job: IEdfJob): string | null => {
  const { missionDescriptionFormatted, missionDescription, description, customFields } = job.jobDescription
  const parts: string[] = []

  if (missionDescriptionFormatted || missionDescription || description) {
    parts.push((missionDescriptionFormatted ?? missionDescription ?? description)!)
  }

  const longText1Formatted = getXmlTextValue(customFields?.LongText1Formatted) ?? null
  if (longText1Formatted) {
    parts.push(longText1Formatted)
  }

  return parts.join("<br /><br />").trim() || null
}

/**
 * Map an EDF XML job to a computed job partner.
 * Returns null for non-alternance contracts (VIE, CDI, etc.) — only CONTRAT_ALTERNANCE offers are imported.
 */
export const edfJobToJobsPartners = (job: IEdfJob): IComputedJobsPartners | null => {
  const contract = job.jobDescription.contract
  // Only import alternance contracts identified by CONTRAT_ALTERNANCE clientcode
  const contractClientcode = contract != null && typeof contract !== "string" ? (contract.$?.clientcode ?? null) : null
  if (contractClientcode !== "CONTRAT_ALTERNANCE") {
    return null
  }

  const result = enedisJobToJobsPartnersProcessor(job, JOBPARTNERS_LABEL.EDF)
  return { ...result, offer_description: buildEdfOfferDescription(job) }
}
