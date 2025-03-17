import { ObjectId } from "bson"
import { IFTJobRaw } from "shared"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const franceTravailJobsToJobsPartners = (job: IFTJobRaw): IComputedJobsPartners => {
  const now = new Date()
  const jobType = job._metadata?.openai?.type || ""
  const expirationDate = dayjs.tz(job.dateCreation).add(2, "months").toDate()
  let businessError: null | JOB_PARTNER_BUSINESS_ERROR = null

  if (expirationDate <= now) {
    businessError = JOB_PARTNER_BUSINESS_ERROR.EXPIRED
  }

  if (["cfa", "entreprise_cfa"].includes(jobType)) {
    businessError = JOB_PARTNER_BUSINESS_ERROR.CFA
  }

  return {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: now,
    updated_at: now,
    partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
    partner_job_id: job.id,
    contract_start: null,
    contract_duration: exactractFTContractDuration(job.typeContratLibelle),
    contract_type: getFTContractType(job.natureContrat),
    offer_title: job.intitule,
    offer_rome_codes: [job.romeCode],
    offer_description: job.description,
    offer_target_diploma: parseDiploma(job.formations?.[0].niveauLibelle),
    offer_to_be_acquired_skills: job.competences ? job.competences.map((competence) => competence.libelle) : [],
    offer_creation: new Date(job.dateCreation),
    offer_expiration: expirationDate,
    offer_opening_count: job.nombrePostes || 1,
    offer_multicast: true,
    workplace_name: job.entreprise.nom,
    workplace_description: job.entreprise.description,
    workplace_address_label: job.lieuTravail.libelle,
    workplace_geopoint: job.lieuTravail.longitude
      ? {
          type: "Point",
          coordinates: [job.lieuTravail.longitude!, job.lieuTravail.latitude!],
        }
      : null,
    workplace_siret: job.entreprise.siret,
    workplace_naf_code: job.codeNAF,
    workplace_naf_label: job.secteurActiviteLibelle,
    workplace_website: job.entreprise.url,
    apply_url: job.contact?.urlPostulation || job.origineOffre.partenaires?.[0]?.url || job.origineOffre.urlOrigine,
    business_error: businessError,
  }
}
type DiplomaEuropean = "3" | "4" | "5" | "6" | "7"
type DiplomaResult = { european: DiplomaEuropean; label: string } | null

function parseDiploma(field): DiplomaResult {
  const diplomaMappings: { pattern: RegExp; european: DiplomaEuropean; label: string }[] = [
    { pattern: /^CAP, BEP et équivalents$/, european: "3", label: "Cap, autres formations niveau (Infrabac)" },
    { pattern: /^3ème achevée ou Brevet$/, european: "3", label: "Cap, autres formations niveau (Infrabac)" },
    { pattern: /^Bac ou équivalent$/, european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
    { pattern: /^2nd ou 1ère achevée$/, european: "3", label: "Cap, autres formations niveau (Infrabac)" },
    { pattern: /^Bac\+2 ou équivalents$/, european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
    { pattern: /^Bac\+3, Bac\+4 ou équivalents$/, european: "6", label: "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)" },
    { pattern: /^Bac\+5 et plus ou équivalents$/, european: "7", label: "Master, titre ingénieur, autres formations niveau (Bac+5)" },
  ]

  for (const { pattern, european, label } of diplomaMappings) {
    if (pattern.test(field)) {
      return { european, label }
    }
  }

  return null
}

function getFTContractType(natureContrat: string) {
  if (natureContrat === "Cont. professionnalisation") {
    return [TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  } else {
    return [TRAINING_CONTRACT_TYPE.APPRENTISSAGE]
  }
}

export function exactractFTContractDuration(typeContratLibelle: string): number | null {
  const match = typeContratLibelle.match(/(\d+)\s*Mois/)
  return match ? parseInt(match[1], 10) : null
}
