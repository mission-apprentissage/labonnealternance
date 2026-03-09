import { ObjectId } from "bson"
import dayjs from "shared/helpers/dayjs"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import type { IEmploiInclusionJob } from "@/common/apis/emploiInclusion/emploi-inclusion.client"

type IEmploiInclusionPoste = IEmploiInclusionJob["postes"][number]

export const isEligiblePoste = (poste: IEmploiInclusionPoste): boolean =>
  (poste.recrutement_ouvert == "True" && poste.type_contrat == "Contrat de professionalisation") || poste.type_contrat == "Contrat d'apprentissage"

export const emploiInclusionJobToJobsPartners = (job: IEmploiInclusionJob, poste: IEmploiInclusionPoste): IComputedJobsPartners => {
  const now = new Date()
  let business_error: null | JOB_PARTNER_BUSINESS_ERROR = null

  if (poste.appellation_modifiee.length < 3) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  if (poste.description.length < 30) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.EMPLOI_INCLUSION,
    partner_job_id: String(poste.id),
    workplace_siret: job.siret,
    workplace_legal_name: job.raison_sociale,
    workplace_name: job.enseigne || job.raison_sociale,
    workplace_description: job.description || null,
    workplace_website: job.site_web || null,
    workplace_address_label: poste.lieu ? `${poste.lieu.nom} ${poste.lieu.code_postaux[0]}` : null,
    workplace_address_zipcode: job.code_postal,
    workplace_address_city: job.ville,
    workplace_address_street_label: job.addresse_ligne_1 || null,
    offer_title: poste.appellation_modifiee || null,
    offer_description: poste.description || null,
    offer_desired_skills: poste.profil_recherche ? [poste.profil_recherche] : [],
    offer_opening_count: poste.nombre_postes_ouverts,
    offer_creation: dayjs.tz(poste.cree_le).toDate(),
    offer_expiration: dayjs.tz(poste.cree_le).add(2, "months").toDate(),
    offer_multicast: true,
    contract_type: getContractType(poste),
    apply_email: job.courriel || null,
    apply_phone: job.telephone || null,
    business_error,
  }

  return partnerJob
}

const getContractType = (poste: IEmploiInclusionPoste): (typeof TRAINING_CONTRACT_TYPE)[keyof typeof TRAINING_CONTRACT_TYPE][] => {
  const contractTypes: (typeof TRAINING_CONTRACT_TYPE)[keyof typeof TRAINING_CONTRACT_TYPE][] = []
  if (poste.type_contrat == "Contrat de professionalisation") {
    contractTypes.push(TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION)
  }
  if (poste.type_contrat == "Contrat d'apprentissage") {
    contractTypes.push(TRAINING_CONTRACT_TYPE.APPRENTISSAGE)
  }
  return contractTypes
}
