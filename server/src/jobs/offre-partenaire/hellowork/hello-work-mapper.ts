import { ObjectId } from "mongodb"
import { joinNonNullStrings } from "shared"
import { NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants/index"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zod-helpers/zod-primitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { z } from "zod"

import { logger } from "@/common/logger"
import { blankComputedJobPartner } from "@/jobs/offre-partenaire/fill-computed-jobs-partners"

export const ZHelloWorkJob = z.looseObject({
  job_id: z.string(),
  contract_start_date: z.string().nullish(),
  contract: z.string(),
  remote: z.string().nullish(),
  contract_period_value: z.coerce.number<number>().nullish(),
  contract_period_unit: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  education: z.string().nullish(),
  profile: z.string().nullish(),
  code_rome: z.string().nullish(),
  publication_date: z.string().nullish(),
  updated_date: z.string().nullish(),
  siret: z.string().nullish(),
  company_title: z.string().nullish(),
  company_description: z.string().nullish(),
  address: z.string().nullish(),
  postal_code: z.string().nullish(),
  city: z.string().nullish(),
  country: z.string().nullish(),
  geoloc: z.string().nullish(),
  url: extensions.url(),
  guid: z.string(),
})

export type IHelloWorkJob = z.output<typeof ZHelloWorkJob>

// le flux Hellowork a changé de vocabulaire en cours de route : on garde les deux formes tant que l'ancien flux n'est pas décommissionné
const teletravailMapping: Record<string, TRAINING_REMOTE_TYPE> = {
  Complet: TRAINING_REMOTE_TYPE.remote,
  Partiel: TRAINING_REMOTE_TYPE.hybrid,
  Occasionnel: TRAINING_REMOTE_TYPE.hybrid,
  Pas_teletravail: TRAINING_REMOTE_TYPE.onsite,
  "Pas de télétravail": TRAINING_REMOTE_TYPE.onsite,
}

const diplomaMapping: Record<string, IComputedJobsPartners["offer_target_diploma"]> = {
  "RJ/Qualif/BEP_CAP": { european: "3", label: NIVEAU_DIPLOME_LABEL["3"] },
  "RJ/Qualif/Employe_Operateur": { european: "3", label: NIVEAU_DIPLOME_LABEL["3"] },
  "RJ/Qualif/Technicien_B2": { european: "5", label: NIVEAU_DIPLOME_LABEL["5"] },
  "RJ/Qualif/Technicien": { european: "5", label: NIVEAU_DIPLOME_LABEL["5"] },
  "RJ/Qualif/Agent_maitrise_B3": { european: "6", label: NIVEAU_DIPLOME_LABEL["6"] },
  "RJ/Qualif/Agent_maitrise": { european: "6", label: NIVEAU_DIPLOME_LABEL["6"] },
  "RJ/Qualif/Cadre_dirigeant": { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] },
  "RJ/Qualif/Ingenieur_B5": { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] },
  "RJ/Qualif/Ingenieur": { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] },
  "BEP/CAP": { european: "3", label: NIVEAU_DIPLOME_LABEL["3"] },
  "Employé/Opérateur/Ouvrier Spe/Bac": { european: "3", label: NIVEAU_DIPLOME_LABEL["3"] },
  "Technicien/Employé Bac +2": { european: "5", label: NIVEAU_DIPLOME_LABEL["5"] },
  "Agent de maîtrise/Bac +3/4": { european: "6", label: NIVEAU_DIPLOME_LABEL["6"] },
  "Ingénieur/Cadre/Bac +5": { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] },
  "Cadre dirigeant": { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] },
  // "Sans diplôme" n'est volontairement pas mappé : ce n'est pas un niveau de diplôme visé
}

// sans ça une évolution du vocabulaire Hellowork retombe silencieusement sur null, comme ça a été le cas pour education et remote
const alreadyWarnedValues = new Set<string>()

const warnOnceOnUnknownValue = (field: string, value: string) => {
  const key = `${field}:${value}`
  if (alreadyWarnedValues.has(key)) return
  alreadyWarnedValues.add(key)
  logger.warn({ field, value }, "valeur Hellowork non reconnue, champ ignoré")
}

function getRemote(job: IHelloWorkJob): TRAINING_REMOTE_TYPE | null {
  if (!job.remote) return null
  const remote = teletravailMapping[job.remote]
  if (!remote) warnOnceOnUnknownValue("remote", job.remote)
  return remote ?? null
}

function getDiplomaLevel(job: IHelloWorkJob): IComputedJobsPartners["offer_target_diploma"] {
  if (job.education == null) return null
  if (job.education in diplomaMapping) return diplomaMapping[job.education]
  warnOnceOnUnknownValue("education", job.education)
  return null
}

export const helloWorkJobToJobsPartners = (job: IHelloWorkJob): IComputedJobsPartners => {
  const {
    contract,
    contract_start_date,
    title,
    description,
    profile,
    code_rome,
    publication_date,
    siret,
    company_title,
    company_description,
    city,
    geoloc,
    url,
    postal_code,
    guid,
  } = job
  const contractDuration: number | null = parseContractDuration(job)
  const { latitude, longitude } = geolocToLatLon(geoloc)
  const siretParsing = extensions.siret.safeParse(siret)
  const codeRomeParsing = extensions.romeCode().safeParse(code_rome)
  const urlParsing = extensions.url().safeParse(url)
  const creationDate = parseDate(publication_date)

  const now = new Date()
  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    partner_job_id: guid,
    contract_start: parseDate(contract_start_date),
    contract_type: contract.toLowerCase() === "alternance" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : undefined,
    contract_remote: getRemote(job),
    contract_duration: contractDuration,
    offer_title: title,
    offer_description: description && description.length >= 30 ? description : undefined,
    offer_target_diploma: getDiplomaLevel(job),
    offer_desired_skills: profile == null ? [] : [profile],
    offer_access_conditions: [],
    offer_multicast: false,
    offer_to_be_acquired_skills: [],
    offer_rome_codes: codeRomeParsing.success ? [codeRomeParsing.data] : undefined,
    offer_creation: creationDate,
    offer_expiration: dayjs
      .tz(creationDate || now)
      .add(2, "months")
      .toDate(),
    workplace_siret: siretParsing.success ? siretParsing.data : null,
    workplace_name: company_title,
    workplace_description: company_description && company_description.length >= 30 ? company_description : null,
    workplace_address_zipcode: postal_code || null,
    workplace_address_city: city || null,
    workplace_address_label: joinNonNullStrings([city, postal_code]),
    workplace_geopoint:
      latitude && longitude
        ? {
            type: "Point",
            coordinates: [longitude, latitude],
          }
        : undefined,
    apply_url: urlParsing.success ? urlParsing.data : null,
  }
  return partnerJob
}

const acceptedGeoLocRegex = /-?[0-9]{1,2}[.,][0-9]+,-?[0-9]{1,3}[.,][0-9]+/

const geolocToLatLon = (geoloc: string | null | undefined) => {
  if (!geoloc || !acceptedGeoLocRegex.test(geoloc)) return {}
  const parts = geoloc.split(",")
  if (parts.length !== 2 && parts.length !== 4) return {}
  const parsedParts = parts.map(parseFloat)
  if (parsedParts.some(isNaN)) return {}
  if (parts.length === 2) {
    return { latitude: parsedParts[0], longitude: parsedParts[1] }
  } else if (parts.length === 4) {
    const latitude = parseFloat(`${parsedParts[0]}.${parsedParts[1]}`)
    const longitude = parseFloat(`${parsedParts[2]}.${parsedParts[3]}`)
    return { latitude, longitude }
  } else {
    throw new Error("inattendu")
  }
}

const parseContractDuration = ({ contract_period_unit, contract_period_value }: { contract_period_unit?: string | null; contract_period_value?: number | null }): number | null => {
  if (!contract_period_unit || !contract_period_value) {
    return null
  }
  switch (contract_period_unit.toLowerCase()) {
    case "year":
      return contract_period_value * 12
    case "month":
      return contract_period_value
    case "week":
      return Math.round((contract_period_value * 7) / (365 / 12))
    case "day":
      return Math.round(contract_period_value / 30)
  }
  return null
}

const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr) {
    return null
  }
  return dayjs.tz(dateStr).toDate()
}
