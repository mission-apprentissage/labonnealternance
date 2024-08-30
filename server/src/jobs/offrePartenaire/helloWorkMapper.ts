import { ObjectId } from "mongodb"
import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "
import { z } from "zod"

export const ZHelloWorkJob = z
  .object({
    job_id: z.string(),
    contract_start_date: z.string().nullish(),
    contract: z.string(),
    remote: z.string().nullish(),
    contract_period_value: z.coerce.number().nullish(),
    contract_period_unit: z.string().nullish(),
    title: z.string(),
    description: z.string().nullish(),
    education: z.string().nullish(),
    profile: z.string().nullish(),
    code_rome: z.string().nullish(),
    publication_date: z.string().nullish(),
    siret: z.string().nullish(),
    company_title: z.string(),
    company_description: z.string().nullish(),
    address: z.string().nullish(),
    postal_code: z.string().nullish(),
    city: z.string().nullish(),
    geoloc: z.string().nullish(),
    url: extensions.url(),
  })
  .passthrough()

export type IHelloWorkJob = z.output<typeof ZHelloWorkJob>

const teletravailMapping: Record<string, TRAINING_REMOTE_TYPE> = {
  Complet: TRAINING_REMOTE_TYPE.remote,
  Partiel: TRAINING_REMOTE_TYPE.hybrid,
  Pas_teletravail: TRAINING_REMOTE_TYPE.onsite,
  Occasionnel: TRAINING_REMOTE_TYPE.hybrid,
}

function getDiplomaLevel(job: IHelloWorkJob): IComputedJobsPartners["offer_diploma_level"] {
  if (job.education == null) return null

  switch (job.education) {
    case "RJ/Qualif/BEP_CAP":
      return { european: "3", label: NIVEAUX_POUR_LBA["3 (CAP...)"] }
    case "RJ/Qualif/Employe_Operateur":
      return { european: "3", label: NIVEAUX_POUR_LBA["3 (CAP...)"] }
    case "RJ/Qualif/Technicien_B2":
      return { european: "5", label: NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"] }
    case "RJ/Qualif/Agent_maitrise_B3":
      return { european: "6", label: NIVEAUX_POUR_LBA["6 (Licence, BUT...)"] }
    case "RJ/Qualif/Cadre_dirigeant":
      return { european: "7", label: NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"] }
    case "RJ/Qualif/Ingenieur_B5":
      return { european: "7", label: NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"] }
    default:
      return null
  }
}

export const helloWorkJobToJobsPartners = (job: IHelloWorkJob): IComputedJobsPartners => {
  const {
    contract,
    job_id,
    contract_start_date,
    remote,
    title,
    description,
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
    partner: JOBPARTNERS_LABEL.HELLOWORK,
    partner_job_id: job_id,
    contract_start_date: parseDate(contract_start_date),
    contract_type: contract.toLowerCase() === "alternance" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : undefined,
    contract_remote: remote ? teletravailMapping[remote] ?? null : null,
    contract_duration: contractDuration,
    offer_title: title,
    offer_description: description && description.length >= 30 ? description : undefined,
    offer_diploma_level: getDiplomaLevel(job),
    offer_desired_skills: profile == null ? null : [profile],
    offer_access_conditions: null,
    offer_to_be_acquired_skills: null,
    offer_rome_codes: codeRomeParsing.success ? [codeRomeParsing.data] : undefined,
    offer_creation_date: parseDate(publication_date),
    offer_expiration_date: null,
    offer_origin: null,
    offer_opening_count: 1,
    offer_multicast: false,
    workplace_siret: siretParsing.success ? siretParsing.data : null,
    workplace_name: company_title,
    workplace_description: company_description && company_description.length >= 30 ? company_description : null,
    workplace_size: null,
    workplace_website: null,
    workplace_address: {
      label: [address, postal_code, city].filter((x) => x).join(" "),
    },
    workplace_geopoint:
      latitude && longitude
        ? {
            type: "Point",
            coordinates: [longitude, latitude],
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

const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr) {
    return null
  }
  return dayjs.tz(dateStr).toDate()
}
