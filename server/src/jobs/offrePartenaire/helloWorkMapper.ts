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

export const helloWorkJobToJobsPartners = (job: IHelloWorkJob): IComputedJobsPartners => {
  const {
    contract,
    job_id,
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
  const contractDuration: number | null = parseContractDuration(job)
  const { latitude, longitude } = geolocToLatLon(geoloc)
  const siretParsing = extensions.siret.safeParse(siret)
  const codeRomeParsing = extensions.romeCode().safeParse(code_rome)

  const partnerJob: IComputedJobsPartners = {
    _id: new ObjectId(),
    created_at: new Date(),
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    partner_id: job_id,
    contract_start: contract_start_date ?? null,
    contract_type: contract.toLowerCase() === "alternance" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : undefined,
    contract_remote: remote ? teletravailMapping[remote] ?? null : null,
    contract_duration: contractDuration,
    offer_title: title,
    offer_description: description && description.length >= 30 ? description : undefined,
    offer_diploma_level_label: education ? diplomeMapping[education] ?? null : null,
    offer_desired_skills: profile ?? null,
    offer_access_condition: null,
    offer_acquired_skills: null,
    offer_rome_code: codeRomeParsing.success ? [codeRomeParsing.data] : undefined,
    offer_creation_date: publication_date ?? null,
    offer_expiration_date: null,
    offer_origin: null,
    offer_count: 1,
    offer_multicast: false,
    workplace_siret: siretParsing.success ? siretParsing.data : null,
    workplace_name: company_title,
    workplace_description: company_description && company_description.length >= 30 ? company_description : null,
    workplace_size: null,
    workplace_website: null,
    workplace_raison_sociale: null,
    workplace_enseigne: null,
    workplace_address: [address, postal_code, city].filter((x) => x).join(" "),
    workplace_geopoint:
      latitude && longitude
        ? {
            type: "Point",
            coordinates: [latitude, longitude],
          }
        : undefined,
    apply_url: url,
    errors: [],
    validated: false,
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
      return Math.ceil((contract_period_value * 7) / (365 / 12))
  }
  return null
}
