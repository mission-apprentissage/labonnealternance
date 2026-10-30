import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import type { SuggestionsNafApplicantWithTargets, SuggestionsNafSector, SuggestionsNafTarget } from "./find-suggestions-naf-targets"

export const MAX_DISTANCE_KM = 100
export const MIN_SUGGESTIONS = 2

export type SuggestionsNafJob = Pick<
  IJobsPartnersOfferPrivate,
  | "_id"
  | "partner_label"
  | "offer_title"
  | "workplace_name"
  | "workplace_legal_name"
  | "workplace_brand"
  | "workplace_address_city"
  | "workplace_address_label"
  | "workplace_siret"
  | "workplace_naf_label"
> & { distance_km: number }

export type SuggestionsNafSuggestion = { sector: SuggestionsNafSector; job: SuggestionsNafJob }

export type SuggestionsNafTargetWithSuggestions = SuggestionsNafTarget & { suggestions: SuggestionsNafSuggestion[] }

export type SuggestionsNafApplicantWithSuggestions = Omit<SuggestionsNafApplicantWithTargets, "targets"> & { targets: SuggestionsNafTargetWithSuggestions[] }

const JOB_PROJECTION = {
  _id: "$_id",
  partner_label: "$partner_label",
  offer_title: "$offer_title",
  workplace_name: "$workplace_name",
  workplace_legal_name: "$workplace_legal_name",
  workplace_brand: "$workplace_brand",
  workplace_address_city: "$workplace_address_city",
  workplace_address_label: "$workplace_address_label",
  workplace_siret: "$workplace_siret",
  workplace_naf_label: "$workplace_naf_label",
  distance_km: "$distance_km",
}

/**
 * Meilleure offre de chaque secteur dans un rayon de 100 km autour de la candidature source : offres LBA, puis
 * partenaires, puis recruteurs LBA, toutes avec un email de candidature, départagées par la distance.
 * Une offre active a une date d'expiration future, sauf les recruteurs LBA qui n'en ont pas (cf. getJobsPartnersFromDBForUI).
 */
const findBestJobBySector = async (target: SuggestionsNafTarget, excludedJobIds: ObjectId[]) => {
  const rows = await getDbCollection("jobs_partners")
    .aggregate<{ _id: string; job: SuggestionsNafJob }>([
      {
        $geoNear: {
          near: target.source_geopoint,
          key: "workplace_geopoint",
          distanceField: "distance_km",
          distanceMultiplier: 0.001,
          maxDistance: MAX_DISTANCE_KM * 1000,
          query: {
            offer_status: JOB_STATUS_ENGLISH.ACTIVE,
            offer_rome_codes: target.rome,
            workplace_naf_code: { $in: target.sectors.map(({ naf }) => naf) },
            apply_email: { $ne: null },
            _id: { $nin: excludedJobIds },
            $or: [{ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, { offer_expiration: { $gt: new Date() } }],
          },
        },
      },
      {
        $addFields: {
          priority: {
            $switch: {
              branches: [
                { case: { $eq: ["$partner_label", JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA] }, then: 0 },
                { case: { $eq: ["$partner_label", JOBPARTNERS_LABEL.RECRUTEURS_LBA] }, then: 2 },
              ],
              default: 1,
            },
          },
        },
      },
      { $group: { _id: "$workplace_naf_code", job: { $top: { sortBy: { priority: 1, distance_km: 1 }, output: JOB_PROJECTION } } } },
    ])
    .toArray()
  return new Map(rows.map(({ _id, job }) => [_id, job]))
}

// Une offre n'est suggérée qu'une fois par candidat : un recruteur LBA multi-ROME pourrait sinon apparaître dans deux emails.
const findTargetsSuggestions = async ({ targets, applications }: SuggestionsNafApplicantWithTargets) => {
  const excludedJobIds = applications.flatMap(({ job_id }) => (job_id ? [job_id] : []))
  const targetsWithSuggestions: SuggestionsNafTargetWithSuggestions[] = []
  for (const target of targets) {
    const jobsBySector = await findBestJobBySector(target, excludedJobIds)
    const suggestions = target.sectors.flatMap((sector) => {
      const job = jobsBySector.get(sector.naf)
      return job ? [{ sector, job }] : []
    })
    excludedJobIds.push(...suggestions.map(({ job }) => job._id))
    targetsWithSuggestions.push({ ...target, suggestions })
  }
  return targetsWithSuggestions
}

export const findSuggestionsNafJobs = async (applicants: SuggestionsNafApplicantWithTargets[]): Promise<SuggestionsNafApplicantWithSuggestions[]> => {
  const result: SuggestionsNafApplicantWithSuggestions[] = []
  for (const applicant of applicants) {
    result.push({ ...applicant, targets: await findTargetsSuggestions(applicant) })
  }
  return result
}
