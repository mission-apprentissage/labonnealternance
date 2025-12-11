/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import dayjs from "shared/helpers/dayjs"
import type { INiveauDiplomeEuropeen } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL, NIVEAUX_DIPLOMES_EUROPEENS } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

export const EngagementJeunesDiplome = {
  BAC: "BAC",
  "BAC+2": "BAC+2",
  "BAC+3": "BAC+3",
  "BAC+4": "BAC+4",
  "BAC+5": "BAC+5",
  "BEP-CAP-BPA": "BEP-CAP-BPA",
  Doctorat: "Doctorat",
  "Mastère spécialisé": "Mastère spécialisé",
  "Sans diplôme": "Sans diplôme",
} as const

const EngagementJeunesDiplomeLabels = Object.values(EngagementJeunesDiplome)
export type EngagementJeunesDiplome = (typeof EngagementJeunesDiplomeLabels)[number]

const mappingDiplomes: Record<EngagementJeunesDiplome, INiveauDiplomeEuropeen | undefined> = {
  "BEP-CAP-BPA": "3",
  BAC: "4",
  "BAC+2": "5",
  "BAC+3": "6",
  "BAC+4": "6",
  "BAC+5": "7",
  Doctorat: "7",
  "Mastère spécialisé": "7",
  "Sans diplôme": undefined,
}

export const ZEngagementJeunesJob = z
  .object({
    id: z.number(),
    creation_date: z.coerce.date(),
    title: z.string(),
    mission: z.string().nullish(),
    profil: z.string().nullish(),
    reference: z.string(),
    contrat: z.enum(["Apprentissage"]).nullish(),
    duree_contrat: z.number().nullish(),
    temps_partiel: z.boolean().nullish(),
    niveau_diplome: extensions.buildEnum(EngagementJeunesDiplome).nullish(),
    societe: z.string(),
    description_societe: z.string(),
    location_pays: z.string().nullish(),
    location_pays_code: z.string().nullish(),
    location_departement: z.string().nullish(),
    location_departement_code: z.string().nullish(),
    location_ville: z.string(),
    location_cp: z.string(),
    application_url: z.string().url(),
  })
  .passthrough()

export type IEngagementJeunesJob = z.output<typeof ZEngagementJeunesJob>

export const engagementJeunesJobToJobsPartners = (job: IEngagementJeunesJob): IComputedJobsPartners => {
  const now = new Date()
  const {
    application_url,
    creation_date,
    description_societe,
    id,
    location_cp,
    location_ville,
    niveau_diplome,
    societe,
    title,
    contrat,
    duree_contrat,
    location_departement,
    location_departement_code,
    location_pays,
    location_pays_code,
    mission,
    profil,
    reference,
    temps_partiel,
  } = job

  const finalDescription = mission ? `<b>Mission :</b><br />${mission}` : null
  const finalProfil = profil ? `<b>Profil :</b><br />${profil}` : null
  const offer_description = [finalDescription, finalProfil]
    .filter((x) => x)
    .join("<br /><br />")
    .replaceAll("<p>", "")
    .replaceAll("</p>", "")

  const mapped = niveau_diplome ? mappingDiplomes[niveau_diplome] : undefined
  const lbaDiplomaOpt = NIVEAUX_DIPLOMES_EUROPEENS.find((x) => x.value === mapped)
  const offer_target_diploma = lbaDiplomaOpt ? { european: lbaDiplomaOpt.value, label: lbaDiplomaOpt.label } : null

  const workplace_address_label = [location_cp, location_ville, location_pays === "France" ? null : location_pays].filter((x) => x).join(" ")

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES,
    partner_job_id: id.toString(),
    contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    offer_title: title,
    offer_description,
    offer_target_diploma,

    offer_multicast: true,
    offer_creation: creation_date,
    offer_expiration: dayjs
      .tz(creation_date || now)
      .add(2, "months")
      .toDate(),

    workplace_name: societe,
    workplace_description: description_societe,
    workplace_address_label,
    workplace_address_zipcode: location_cp,
    workplace_address_city: location_ville,
    apply_url: application_url,
  }
  return partnerJob
}
