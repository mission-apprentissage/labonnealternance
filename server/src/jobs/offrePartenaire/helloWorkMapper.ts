import { ObjectId } from "mongodb"
import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "
import { z } from "zod"

export const ZHelloWorkJob = z.object({
  job_id: z.string(),
  contract_start_date: z.coerce.date().nullish(),
  contract: z.string(),
  remote: z.string().nullish(),
  contract_period_value: z.coerce.number().nullish(),
  contract_period_unit: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  education: z.string().nullish(),
  profile: z.string().nullish(),
  code_rome: z.string().nullish(),
  publication_date: z.coerce.date().nullish(),
  siret: z.string().nullish(),
  company_title: z.string(),
  company_description: z.string().nullish(),
  address: z.string().nullish(),
  postal_code: z.string().nullish(),
  city: z.string().nullish(),
  geoloc: z.string().nullish(),
  url: extensions.url(),
})

export type IHelloWorkJob = z.output<typeof ZHelloWorkJob>

const teletravailMapping: Record<string, TRAINING_REMOTE_TYPE> = {
  Complet: TRAINING_REMOTE_TYPE.TELETRAVAIL,
  Partiel: TRAINING_REMOTE_TYPE.HYBRID,
  Pas_teletravail: TRAINING_REMOTE_TYPE.PRESENTIEL,
  Occasionnel: TRAINING_REMOTE_TYPE.HYBRID,
}

const diplomeValues = Object.values(NIVEAUX_POUR_LBA)

const diplomeMapping: Record<string, (typeof diplomeValues)[number]> = {
  "RJ/Qualif/BEP_CAP": NIVEAUX_POUR_LBA["3 (CAP...)"],
  "RJ/Qualif/Employe_Operateur": NIVEAUX_POUR_LBA["3 (CAP...)"],
  "RJ/Qualif/Technicien_B2": NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"],
  "RJ/Qualif/Agent_maitrise_B3": NIVEAUX_POUR_LBA["6 (Licence, BUT...)"],
  "RJ/Qualif/Cadre_dirigeant": NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"],
  "RJ/Qualif/Ingenieur_B5": NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"],
}

export const helloWorkJobToJobsPartners = (job: IHelloWorkJob) => {
  const {
    contract,
    job_id,
    contract_period_unit,
    contract_period_value,
    contract_start_date,
    remote,
    title,
    description,
    education,
    profile,
    code_rome,
    publication_date,
    siret,
    company_title,
    company_description,
    address,
    city,
    postal_code,
    geoloc,
    url,
  } = job
  let contractDuration: number | null = null
  if (contract_period_unit && contract_period_value) {
    switch (contract_period_unit) {
      case "Year":
        contractDuration = contract_period_value * 12
        break
      case "Month":
        contractDuration = contract_period_value
        break
      case "Week":
        contractDuration = Math.ceil((contract_period_value * 7) / (365 / 12))
        break
    }
  }
  const { latitude, longitude } = geolocToLatLon(geoloc)

  const partnerJob: IComputedJobsPartners = {
    _id: new ObjectId(),
    created_at: new Date(),
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    raw_id: job_id,
    contract: {
      start: contract_start_date ?? null,
      type: contract.toLowerCase() === "alternance" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : [],
      remote: remote ? teletravailMapping[remote] ?? null : null,
      duration: contractDuration,
    },
    job_offer: {
      title,
      description: description && description.length >= 30 ? description : undefined,
      diploma_level_label: education ? diplomeMapping[education] ?? null : null,
      desired_skills: profile ?? null,
      access_condition: null,
      acquired_skills: null,
      rome_code: code_rome ?? undefined,
      publication: {
        creation_date: publication_date ?? null,
        expiration_date: null,
      },
      meta: {
        origin: null,
        count: 1,
        multicast: false,
      },
    },
    workplace: {
      siret: extensions.siret.safeParse(siret).success ? siret : null,
      name: company_title,
      description: company_description && company_description.length >= 30 ? company_description : null,
      size: null,
      website: null,
      raison_sociale: null,
      enseigne: null,
      location: {
        address: [address, postal_code, city].filter((x) => x).join(" "),
        latitude,
        longitude,
      },
    },
    apply: {
      url,
      email: null,
      phone: null,
    },
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
