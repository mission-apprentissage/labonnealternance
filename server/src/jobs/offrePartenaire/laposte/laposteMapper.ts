import { ObjectId } from "mongodb"
import { NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

//import { formatHtmlForPartnerDescription } from "@/common/utils/stringUtils"

import { formatHtmlForPartnerDescription } from "@/common/utils/stringUtils"

import { isCompanyInBlockedCfaList } from "../blockJobsPartnersFromCfaList"
import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZLaposteJob = z
  .object({
    "intitule-du-poste": z.string(),
    reference: z.string(),
    "date-de-mise-a-jour": z.string(),
    "type-de-contrat": z.string(),
    "duree-du-contrat": z.string().nullable(),
    company: z.string(),
    "region-du-poste": z.string(),
    "departement-du-poste": z.string().describe("ex: Var (83)"),
    "localisation-du-poste": z.string().describe("ville"),
    localite: z.string().nullable().describe("ex : 83126 LA SEYNE SUR MER"),
    longitude: z.coerce.number(),
    latitude: z.coerce.number(),
    contexte: z.string().describe("description"),
    filiere: z.string().describe("ex : Distribution / Livraison<"),
    metier: z.string().nullable().describe("ex: Responsable collecte distribution"),
    "fiche-metier": z.string().nullable().describe("slug à coller après https://www.laposterecrute.fr ex: /fichemetier/responsable-collecte-distribution"),
    "description-de-la-mission": z.string().describe("description en CDATA"),
    "profil-recherche": z.string().describe("description"),
    "formation-et-experience": z.string().describe("description en CDATA"),
    "niveau-de-formation-requis": z.string().describe("ex: Bac+3"),
    "url-de-l-offre": z.string().describe("lien vers l'offre"),
    "nombre-d-annees-d-experience-total": z.string().describe("ex: 0-1 an"),
    "remuneration-brute-annuelle": z.string().describe("0 peut être présent"),
    "temps-de-travail-hebdomadaire": z.string().nullable().describe("ex: 35"),
    teletravail: z.string().nullable(),
    Broadbean: z.string().nullable(),
    "profil-candidat": z.string().describe("description en CDATA"),
  })
  .passthrough()

export type ILaposteJob = z.output<typeof ZLaposteJob>

export const laposteJobToJobsPartners = (job: ILaposteJob): IComputedJobsPartners => {
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
    contract_type = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE]
  }

  let contract_duration: number | null = null
  switch (job["duree-du-contrat"]) {
    case "12 ou 24 mois":
    case "12 à 24 mois":
      contract_duration = 12
      break
    default:
      contract_duration = job["duree-du-contrat"] ? parseInt(job["duree-du-contrat"]) : null
  }

  let offer_target_diploma: { european: "3" | "4" | "5" | "6" | "7"; label: string } | null = null
  let european: "3" | "4" | "5" | "6" | "7" | null = null
  switch (job["niveau-de-formation-requis"]) {
    case "Inférieur au Bac":
      break
    case "Bac":
      european = contract_duration && contract_duration >= 12 ? (contract_duration > 24 ? "6" : "5") : "4"
      break
    case "Bac+2":
      european = contract_duration && contract_duration >= 12 ? (contract_duration > 24 ? "7" : "6") : "5"
      break
    case "Bac+3":
      european = contract_duration && contract_duration > 12 ? "7" : "6"
      break
    case "Bac+4":
    case "Bac+5":
    case "Supérieur à Bac+5":
      offer_target_diploma = { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] }
      break
    default:
      throw new Error(`Niveau de formation non géré : ${job["niveau-de-formation-requis"]}`)
  }

  offer_target_diploma = european && { european, label: NIVEAU_DIPLOME_LABEL[european] }

  let descriptionComputed = ""
  descriptionComputed += job.metier ? "- Métier : " + job.metier + "\r\n" : ""
  descriptionComputed += job["fiche-metier"] ? "- Fiche métier : https://www.laposterecrute.fr" + job["fiche-metier"] + "\r\n" : ""
  descriptionComputed += job.filiere ? "- Filière : " + job.filiere + "\r\n" : ""
  descriptionComputed += job["nombre-d-annees-d-experience-total"] ? "- Expérience : " + job["nombre-d-annees-d-experience-total"] + "\r\n" : ""
  descriptionComputed +=
    job["remuneration-brute-annuelle"] && job["remuneration-brute-annuelle"] !== "0" ? "- Rémunération brute annuelle: " + job["remuneration-brute-annuelle"] + "\r\n" : ""
  descriptionComputed += job["temps-de-travail-hebdomadaire"] ? "- Temps de travail hebdomadaire : " + job["temps-de-travail-hebdomadaire"] + "\r\n" : ""

  descriptionComputed += `\r\nDescription de la mission :\r\n\r\n${job["description-de-la-mission"]}\r\n\r\n`
  descriptionComputed += job["profil-recherche"] ? `Profil recherché : ${job["profil-recherche"]}\r\n\r\n` : ""
  descriptionComputed += job["formation-et-experience"] ? `Formation et expérience :\r\n\r\n${job["formation-et-experience"]}\r\n\r\n` : ""
  descriptionComputed += job["profil-candidat"] ? `Profil candidat :\r\n\r\n${job["profil-candidat"]}\r\n\r\n` : ""

  descriptionComputed = formatHtmlForPartnerDescription(descriptionComputed).trim()

  const publicationDate = new Date()
  const [day, month, yearAndTime] = job["date-de-mise-a-jour"].split("-")
  const [year, time] = yearAndTime.split(" ")
  const isoString = `${year}-${month}-${day}T${time}`

  const updatedDate = new Date(isoString)

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: updatedDate ?? publicationDate,
    partner_label: JOBPARTNERS_LABEL.LAPOSTE,
    partner_job_id: job.reference,
    offer_title: job["intitule-du-poste"],
    workplace_name: "La Poste",
    workplace_geopoint,
    workplace_address_city: job["localisation-du-poste"],
    workplace_address_label: job["localisation-du-poste"],
    workplace_description: `Service : ${job.company}\r\n\r\n` + job.contexte,
    offer_description: descriptionComputed,
    offer_creation: updatedDate ?? publicationDate,
    offer_expiration: dayjs
      .tz(updatedDate ?? publicationDate)
      .add(2, "months")
      .toDate(),
    apply_url: job["url-de-l-offre"],
    contract_type,
    contract_remote: !job.teletravail ? null : job.teletravail === "Oui" ? TRAINING_REMOTE_TYPE.hybrid : TRAINING_REMOTE_TYPE.onsite,
    offer_target_diploma,
    contract_duration: contract_duration,
    offer_multicast: true,
    business_error,
  }
  return partnerJob
}
