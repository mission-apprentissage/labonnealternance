import { ObjectId } from "bson"
import dayjs from "shared/helpers/dayjs"
import { TRAINING_REMOTE_TYPE } from "shared/constants/recruteur"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import type { IJobEtudiantJob } from "@/common/apis/etudiant/etudiant.client"

// Seules les offres dont la traduction FR du contrat est cette valeur sont importées (filtre dans processEtudiant)
export const ETUDIANT_ELIGIBLE_CONTRACT_FR = "Alternance - Apprentissage / Professionalisation"

export const REMOTE_FR_MAP: Record<string, TRAINING_REMOTE_TYPE> = {
  "Pas de télétravail": TRAINING_REMOTE_TYPE.onsite,
  "100% télétravail": TRAINING_REMOTE_TYPE.remote,
  "Ouvert au télétravail": TRAINING_REMOTE_TYPE.hybrid,
}

const stripHtml = (html: string | null): string => (html ?? "").replace(/<[^>]*>/g, "").trim()

const buildWorkplaceDescription = (desc: IJobEtudiantJob["description"]): string | null => {
  const parts = [desc.company_desc, desc.benefit_desc, desc.process_desc].map(stripHtml).filter(Boolean)
  return parts.length > 0 ? parts.join("\n") : null
}

export const etudiantJobToJobsPartners = (job: IJobEtudiantJob): IComputedJobsPartners => {
  const now = new Date()
  let business_error: null | JOB_PARTNER_BUSINESS_ERROR = null

  const offerTitle = job.name?.trim() ?? null
  const rawDescription = job.description.job_desc ? stripHtml(job.description.job_desc) : null

  if (!offerTitle || offerTitle.length < 3) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  if (!rawDescription || rawDescription.length < 30) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  const addressParts = [
    job.location.address_nbr,
    job.location.address,
    job.location.city,
    job.location.administrative_area_department,
    job.location.administrative_area_region,
    job.location.country,
  ].filter(Boolean)

  return {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.JOB_ETUDIANT,
    partner_job_id: job.public_id,
    workplace_siret: null,
    workplace_legal_name: job.company.name,
    workplace_name: job.company.name,
    workplace_website: null,
    workplace_description: buildWorkplaceDescription(job.description),
    workplace_address_label: addressParts.length > 0 ? addressParts.join(" ") : null,
    workplace_address_street_label: job.location.address || null,
    workplace_address_zipcode: null,
    workplace_address_city: job.location.city || null,
    offer_title: offerTitle,
    offer_description: rawDescription,
    offer_desired_skills: job.description.profile_desc ? [stripHtml(job.description.profile_desc)].filter(Boolean) : [],
    offer_creation: dayjs.tz(job.publishedAt).toDate(),
    offer_expiration: dayjs.tz(job.publishedAt).add(2, "months").toDate(),
    contract_type: ["Apprentissage", "Professionnalisation"],
    contract_remote: (job.remote?.translation?.fr ? REMOTE_FR_MAP[job.remote.translation.fr] : null) ?? null,
    apply_url: job.apply_url || null,
    business_error,
  }
}
