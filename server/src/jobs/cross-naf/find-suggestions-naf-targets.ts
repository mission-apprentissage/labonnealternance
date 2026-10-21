import type { ObjectId } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import type { IReferentielRomeNaf } from "shared/models/referentiel-rome-naf.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

import type { SuggestionsNafApplicant } from "./find-suggestions-naf-applicants"
import { MAX_APPLICATIONS, SUGGESTION_SOURCE_JOB_ORIGINS } from "./find-suggestions-naf-applicants"

export const NAF_SUGGESTIONS_PER_ROME = 5

export type SuggestionsNafSector = Pick<IReferentielRomeNaf, "naf" | "naf_libelle" | "rang" | "contrats_par_annee">

export type SuggestionsNafSourceJob = Pick<
  IJobsPartnersOfferPrivate,
  "offer_title" | "workplace_name" | "workplace_brand" | "workplace_legal_name" | "workplace_naf_label" | "workplace_address_city"
>

// Un email par ROME candidaté : la candidature source est la 1re sur ce ROME, son lieu borne la recherche d'offres.
export type SuggestionsNafTarget = {
  rome: string
  rome_libelle: string
  source_application_id: ObjectId
  source_geopoint: IJobsPartnersOfferPrivate["workplace_geopoint"]
  source_job: SuggestionsNafSourceJob
  sectors: SuggestionsNafSector[]
}

export type SuggestionsNafApplicantWithTargets = SuggestionsNafApplicant & { targets: SuggestionsNafTarget[] }

type AppliedJob = Pick<IJobsPartnersOfferPrivate, "_id" | "offer_rome_codes" | "workplace_naf_code" | "workplace_geopoint"> & SuggestionsNafSourceJob

type RomeSectors = { _id: string; rome_libelle: string; sectors: SuggestionsNafSector[] }

const findAppliedJobs = async (applicants: SuggestionsNafApplicant[]) => {
  const jobIds = applicants.flatMap(({ applications }) =>
    applications.flatMap(({ job_id, job_origin }) => (job_id && SUGGESTION_SOURCE_JOB_ORIGINS.includes(job_origin) ? [job_id] : []))
  )
  const jobs = await getDbCollection("jobs_partners")
    .find<AppliedJob>(
      { _id: { $in: jobIds } },
      {
        projection: {
          _id: 1,
          offer_rome_codes: 1,
          workplace_naf_code: 1,
          workplace_geopoint: 1,
          offer_title: 1,
          workplace_name: 1,
          workplace_brand: 1,
          workplace_legal_name: 1,
          workplace_naf_label: 1,
          workplace_address_city: 1,
        },
      }
    )
    .toArray()
  return new Map(jobs.map((job) => [job._id.toString(), job]))
}

// Chaque ROME perd au plus un NAF par candidature exclue : on lit assez de rangs pour en garder 5 ensuite.
const findSectorsByRome = async (romes: string[]) => {
  const rows = await getDbCollection("referentiel_rome_naf")
    .aggregate<RomeSectors>([
      { $match: { rome: { $in: romes } } },
      {
        $group: {
          _id: "$rome",
          rome_libelle: { $first: "$rome_libelle" },
          sectors: {
            $topN: {
              n: NAF_SUGGESTIONS_PER_ROME + MAX_APPLICATIONS,
              sortBy: { rang: 1 },
              output: { naf: "$naf", naf_libelle: "$naf_libelle", rang: "$rang", contrats_par_annee: "$contrats_par_annee" },
            },
          },
        },
      },
    ])
    .toArray()
  return new Map(rows.map((row) => [row._id, row]))
}

type TargetDraft = Omit<SuggestionsNafTarget, "rome_libelle" | "sectors"> & { excluded_nafs: Set<string> }

// Une candidature ne porte qu'un ROME, le premier de l'offre. Les candidatures sur un même ROME partagent un email
// et en excluent tous leurs NAF.
const buildTargetDrafts = (applicant: SuggestionsNafApplicant, appliedJobs: Map<string, AppliedJob>) => {
  const drafts = new Map<string, TargetDraft>()
  for (const application of applicant.applications) {
    if (!application.job_id || !SUGGESTION_SOURCE_JOB_ORIGINS.includes(application.job_origin)) continue
    const job = appliedJobs.get(application.job_id.toString())
    const rome = job?.offer_rome_codes[0]
    if (!job || !rome) continue

    const { offer_title, workplace_name, workplace_brand, workplace_legal_name, workplace_naf_label, workplace_address_city } = job
    const draft = drafts.get(rome) ?? {
      rome,
      source_application_id: application._id,
      source_geopoint: job.workplace_geopoint,
      source_job: { offer_title, workplace_name, workplace_brand, workplace_legal_name, workplace_naf_label, workplace_address_city },
      excluded_nafs: new Set<string>(),
    }
    if (job.workplace_naf_code) draft.excluded_nafs.add(job.workplace_naf_code)
    drafts.set(rome, draft)
  }
  return [...drafts.values()]
}

export const findSuggestionsNafTargets = async (applicants: SuggestionsNafApplicant[]): Promise<SuggestionsNafApplicantWithTargets[]> => {
  const appliedJobs = await findAppliedJobs(applicants)
  const draftsByApplicant = applicants.map((applicant) => buildTargetDrafts(applicant, appliedJobs))
  const sectorsByRome = await findSectorsByRome([...new Set(draftsByApplicant.flatMap((drafts) => drafts.map(({ rome }) => rome)))])

  return applicants.map((applicant, index) => ({
    ...applicant,
    targets: draftsByApplicant[index].flatMap(({ excluded_nafs, ...draft }) => {
      const romeSectors = sectorsByRome.get(draft.rome)
      const sectors = (romeSectors?.sectors ?? []).filter(({ naf }) => !excluded_nafs.has(naf)).slice(0, NAF_SUGGESTIONS_PER_ROME)
      return romeSectors && sectors.length ? [{ ...draft, rome_libelle: romeSectors.rome_libelle, sectors }] : []
    }),
  }))
}
