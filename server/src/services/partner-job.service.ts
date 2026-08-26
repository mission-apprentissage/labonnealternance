import { notFound } from "@hapi/boom"
import type { ObjectId } from "mongodb"
import { TRAINING_REMOTE_TYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE, UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import type { ILbaItemPartnerJob } from "shared/models/index"
import { JOB_STATUS_ENGLISH, JobCollectionName, traductionJobStatus } from "shared/models/index"
import type { IJobsPartnersOfferPrivateWithDistance } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { isCfaEntreprise } from "shared/services/is-cfa-entreprise"
import { isGeiqEntreprise } from "shared/services/is-geiq-entreprise"
import { roundDistance } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { generateApplicationToken } from "./app-links.service"
import { getApplicationByJobCount, PARTNERS_WITH_APPLICATION_API } from "./application.service"
import { getHiringCountLastFullYears } from "./deca-contrats.service"
import { getRecipientID } from "./jobs/job-opportunity/job-opportunity.service"

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformPartnerJob(
  partnerJob: IJobsPartnersOfferPrivateWithDistance,
  applicationCountMap?: null | Map<string, number>,
  hiringCount3Years?: number | null
): ILbaItemPartnerJob {
  const romes = partnerJob.offer_rome_codes.map((code) => ({ code, label: null }))
  const longitude = partnerJob.workplace_geopoint.coordinates[0]
  const latitude = partnerJob.workplace_geopoint.coordinates[1]
  const id = partnerJob._id.toString()

  const recipient_id =
    partnerJob.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA ? getRecipientID(JobCollectionName.recruiters, id) : getRecipientID(JobCollectionName.partners, id)

  const resultJob: ILbaItemPartnerJob = {
    id,
    ideaType: partnerJob.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA : LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    title: partnerJob.offer_title,
    token: generateApplicationToken({ jobId: id }),
    recipient_id,
    place: {
      //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
      distance: partnerJob?.distance != null && partnerJob?.distance >= 0 ? roundDistance((partnerJob?.distance ?? 0) / 1000) : null,
      fullAddress: partnerJob.is_delegated ? partnerJob.cfa_address_label : partnerJob.workplace_address_label,
      latitude,
      longitude,
      numberAndStreet: partnerJob.is_delegated ? partnerJob.cfa_address_label : partnerJob.workplace_address_label, // TODO: remplacer par fullAddress et supprimer
      city: partnerJob.workplace_address_city,
      zipCode: partnerJob.workplace_address_zipcode,
      remoteOnly: partnerJob?.contract_remote === TRAINING_REMOTE_TYPE.remote ? true : false,
    },
    company: {
      siret: partnerJob.is_delegated ? partnerJob.cfa_siret : partnerJob.workplace_siret,
      name: partnerJob.is_delegated ? partnerJob.cfa_legal_name : (partnerJob.workplace_name ?? partnerJob.workplace_brand ?? partnerJob.workplace_legal_name ?? UNKNOWN_COMPANY),
      size: partnerJob.workplace_size,
      opco: { label: partnerJob.workplace_opco, url: null },
      url: partnerJob.workplace_website,
      mandataire: partnerJob.is_delegated,
      elligibleHandicap: partnerJob.contract_is_disabled_elligible ?? null,
      isGeiq: isGeiqEntreprise(partnerJob.workplace_siret, partnerJob.cfa_siret),
      // N'apparaît que sur la fiche détail (getPartnerJobByIdV2) : absent (pas juste `undefined`) des
      // résultats de recherche, qui n'en ont pas besoin et n'appellent pas deca-contrats.service pour ça.
      ...(hiringCount3Years !== undefined ? { hiringCount3Years } : {}),
    },
    job: {
      id: partnerJob.partner_job_id,
      partner_label: partnerJob.partner_label,
      description: partnerJob.offer_description,
      employeurDescription: partnerJob.workplace_description,
      creationDate: partnerJob.offer_creation && new Date(partnerJob.offer_creation),
      type: partnerJob.contract_type,
      jobStartDate: partnerJob.contract_start && new Date(partnerJob.contract_start),
      dureeContrat: partnerJob.contract_duration ? `${partnerJob.contract_duration} mois` : null,
      jobExpirationDate: partnerJob.offer_expiration && new Date(partnerJob.offer_expiration),
      quantiteContrat: partnerJob.offer_opening_count,
      status: partnerJob.offer_status && traductionJobStatus(partnerJob.offer_status),
      offer_desired_skills: partnerJob.offer_desired_skills,
      offer_to_be_acquired_skills: partnerJob.offer_to_be_acquired_skills,
      offer_to_be_acquired_knowledge: partnerJob.offer_to_be_acquired_knowledge,
      offer_access_conditions: partnerJob.offer_access_conditions,
      elligibleHandicap: partnerJob.contract_is_disabled_elligible ?? null,
      contract_rythm: partnerJob.contract_rythm ?? null,
      startType: partnerJob.contract_start_type ?? null,
      startDateFlexible: partnerJob.contract_start_is_flexible ?? null,
      isCfaEntreprise: isCfaEntreprise(partnerJob.workplace_siret, partnerJob.cfa_siret),
      to_applicant_questions: partnerJob.to_applicant_questions,
    },

    contact: {
      email: "",
      phone: partnerJob.apply_phone,
      url: partnerJob.apply_url,
      hasEmail: partnerJob.apply_email || PARTNERS_WITH_APPLICATION_API.includes(partnerJob.partner_label) ? true : false,
    },

    nafs: [{ label: partnerJob.workplace_naf_label, code: partnerJob.workplace_naf_code }],
    romes,
    target_diploma_level: partnerJob?.offer_target_diploma?.label || null,
  }

  if (applicationCountMap && resultJob.contact?.hasEmail) {
    resultJob.applicationCount = applicationCountMap.get(id) ?? 0
  }

  return resultJob
}

export const getPartnerJobByIdV2 = async (jobId: ObjectId): Promise<ILbaItemPartnerJob> => {
  const rawPartnerJob = await getDbCollection("jobs_partners").findOne({ _id: jobId })

  if (!rawPartnerJob) {
    throw notFound("Job not found")
  }

  const applicationCountByJob = await getApplicationByJobCount([jobId])
  const applicationCountMap = new Map(applicationCountByJob.map(({ _id, count }) => [_id, count]))

  // Le compteur d'alternants recrutés se rattache à l'entreprise employeuse (workplace_siret), pas au
  // CFA délégataire de la candidature : à la différence de company.siret plus haut, on ne bascule pas sur
  // cfa_siret quand is_delegated est vrai.
  const hiringCount3Years = rawPartnerJob.workplace_siret ? await getHiringCountLastFullYears(rawPartnerJob.workplace_siret) : null

  const partnerJob = transformPartnerJob(rawPartnerJob, applicationCountMap, hiringCount3Years)

  return partnerJob
}

export const anonymizeLbaJobsPartners = async ({ partner_job_ids }: { partner_job_ids: string[] }) => {
  const jobsPartnersCollection = getDbCollection("jobs_partners")
  const now = new Date()
  await jobsPartnersCollection.updateMany(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, partner_job_id: { $in: partner_job_ids } },
    {
      $set: {
        apply_email: null,
        apply_phone: null,
        apply_url: null,
        offer_description: "",
        workplace_description: null,
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
        updated_at: now,
        offer_status_history: [
          {
            status: JOB_STATUS_ENGLISH.ANNULEE,
            reason: "recruiter has been anonymized",
            date: now,
            granted_by: "lba",
          },
        ],
      },
    }
  )
}
