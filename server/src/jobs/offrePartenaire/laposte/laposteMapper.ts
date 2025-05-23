import { ObjectId } from "mongodb"
import { NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

//import { formatHtmlForPartnerDescription } from "@/common/utils/stringUtils"

import { isCompanyInBlockedCfaList } from "../blockJobsPartnersFromCfaList"
import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZLaposteJob = z
  .object({
    "intitule-du-poste": z.string(),
    reference: z.string(),
    "date-de-mise-a-jour": z.coerce.date(),
    "type-de-contrat": z.string(),
    "duree-du-contrat": z.coerce.number(),
    company: z.string(),
    "region-du-poste": z.string(),
    "departement-du-poste": z.string().describe("ex: Var (83)"),
    "localisation-du-poste": z.string().describe("ville"),
    localite: z.string().nullable().describe("ex : 83126 LA SEYNE SUR MER"),
    longitude: z.coerce.number(),
    latitude: z.coerce.number(),
    contexte: z.string().describe("description"),
    filiere: z.string().describe("ex : Distribution / Livraison<"),
    metier: z.string().describe("ex: Responsable collecte distribution"),
    "fiche-metier": z.string().nullable().describe("slug à coller après https://www.laposterecrute.fr ex: /fichemetier/responsable-collecte-distribution"),
    "description-de-la-mission": z.string().describe("description en CDATA"),
    "profil-recherche": z.string().describe("description"),
    "formation-et-experience": z.string().describe("description en CDATA"),
    "niveau-de-formation-requis": z.string().describe("ex: Bac+3"),
    "url-de-l-offre": z.string().describe("lien vers l'offre"),
    "nombre-d-annees-d-experience-total": z.string().describe("ex: 0-1 an"),
    "remuneration-brute-annuelle": z.string().describe("0 peut être présent"),
    "temps-de-travail-hebdomadaire": z.string().describe("ex: 35"),
    teletravail: z.string().nullable(),
    Broadbean: z.string().nullable(),
    "profil-candidat": z.string().describe("description en CDATA"),
  })
  .passthrough()

export type ILaposteJob = z.output<typeof ZLaposteJob>

export const laposteJobToJobsPartners = (job: ILaposteJob): IComputedJobsPartners => {
  /*
  TODO LIST :

  corriger les champs pris en coerce, la date ne doit pas convenir
  vérifier les number

  finaliser les descriptions
  proprifier l'échantillon xml de tests
  finaliser les tests
*/

  const workplace_geopoint: {
    type: "Point"
    coordinates: [number, number]
  } = {
    type: "Point",
    coordinates: [job.longitude, job.latitude],
  }

  let business_error: string | null = null
  if (isCompanyInBlockedCfaList(job.company)) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.CFA
  }
  let contract_type: ("Apprentissage" | "Professionnalisation")[] = []
  if (job["type-de-contrat"] !== "Alternance") {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  } else {
    contract_type = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  }

  let offer_target_diploma: { european: "3" | "4" | "5" | "6" | "7"; label: string } | null = null
  switch (job["niveau-de-formation-requis"]) {
    case "Inférieur au Bac":
      offer_target_diploma = { european: "3", label: NIVEAU_DIPLOME_LABEL["3"] }
      break
    case "Bac":
      offer_target_diploma = { european: "4", label: NIVEAU_DIPLOME_LABEL["4"] }
      break
    case "Bac+2":
      offer_target_diploma = { european: "5", label: NIVEAU_DIPLOME_LABEL["5"] }
      break
    case "Bac+3":
      offer_target_diploma = { european: "6", label: NIVEAU_DIPLOME_LABEL["6"] }
      break
    case "Bac+4":
    case "Bac+5":
      offer_target_diploma = { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] }
      break
    default:
      throw new Error(`Niveau de formation non géré : ${job["niveau-de-formation-requis"]}`)
  }

  /*
    "region-du-poste": z.string(),
    "departement-du-poste": z.string().describe("ex: Var (83)"),
    filiere: z.string().describe("ex : Distribution / Livraison<"),
    metier: z.string().describe("ex: Responsable collecte distribution"),
    "fiche-metier": z.string().nullable().describe("slug à coller après https://www.laposterecrute.fr ex: /fichemetier/responsable-collecte-distribution"),
    "description-de-la-mission": z.string().describe("description en CDATA"),
    "profil-recherche": z.string().describe("description"),
    "formation-et-experience": z.string().describe("description en CDATA"),
    "nombre-d-annees-d-experience-total": z.string().describe("ex: 0-1 an"),
    "remuneration-brute-annuelle": z.string().describe("0 peut être présent"),
    "temps-de-travail-hebdomadaire": z.string().describe("ex: 35"),
    "profil-candidat": z.string().describe("description en CDATA"),


    //fiche métier : https://www.laposterecrute.fr/fichemetier/responsable-commercial
    */

  // const descriptionComputed = formatHtmlForPartnerDescription(html_description + html_profile).trim()

  const publicationDate = new Date()
  const updatedDate = job["date-de-mise-a-jour"]

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: updatedDate ?? publicationDate,
    partner_label: JOBPARTNERS_LABEL.LAPOSTE,
    partner_job_id: job.reference,

    offer_title: job["intitule-du-poste"],
    workplace_name: job.company,
    workplace_geopoint,
    workplace_address_city: job["localisation-du-poste"],
    workplace_address_label: job["localisation-du-poste"],
    workplace_description: job.contexte,

    // offer_description: descriptionComputed,
    offer_creation: updatedDate ?? publicationDate,
    offer_expiration: dayjs
      .tz(updatedDate ?? publicationDate)
      .add(2, "months")
      .toDate(),

    apply_url: job["url-de-l-offre"],
    contract_type,

    contract_remote: !job.teletravail ? null : job.teletravail === "Oui" ? TRAINING_REMOTE_TYPE.hybrid : TRAINING_REMOTE_TYPE.onsite,

    offer_target_diploma,
    contract_duration: job["duree-du-contrat"],

    offer_multicast: true,
    business_error,
  }
  return partnerJob
}
