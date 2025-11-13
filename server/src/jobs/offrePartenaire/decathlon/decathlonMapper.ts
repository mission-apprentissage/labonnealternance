import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL, NIVEAUX_DIPLOMES_EUROPEENS } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

export const ZDecathlonJob = z
  .object({
    reference: z.string(),
    title: z.string(),
    description: z.string().nullish(),
    profile: z.string().nullish(),
    contract_type: z.string().nullish(),
    education_level: z.string().nullish(),
    skills: z.array(z.string()).nullish(),
    published_at: z.string().nullish(),
    contract_duration: z
      .object({
        min: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    brand: z
      .object({
        name: z.string().nullish(),
        description: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    entity: z
      .object({
        address: z
          .object({
            formatted: z.string().nullish(),
            position: z
              .object({
                lon: z.string().nullish(),
                lat: z.string().nullish(),
              })
              .passthrough()
              .nullish(),
            parts: z.object({
              street: z.string().nullish(),
              zip: z.string().nullish(),
              city: z.string().nullish(),
              county: z.string().nullish(),
              state: z.string().nullish(),
              country: z.string().nullish(),
            }),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
    apply_url: z.string().nullish(),
  })
  .passthrough()

export type IDecathlonJob = z.output<typeof ZDecathlonJob>

export const decathlonJobToJobsPartners = (job: IDecathlonJob): IComputedJobsPartners => {
  const { contract_duration, reference, title, description, education_level, skills = [], published_at, brand, entity, apply_url, contract_type, profile } = job
  const { address } = entity ?? {}
  const { position } = address ?? {}
  const { lat, lon } = position ?? {}

  const created_at = new Date()

  const finalDescription = description ? `Description :<br />${description}` : null
  const finalProfile = profile ? `Profil :<br />${profile}` : null
  const offer_description = [finalDescription, finalProfile].filter((x) => x).join("<br /><br />")

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at,
    updated_at: created_at,
    partner_label: JOBPARTNERS_LABEL.DECATHLON,
    partner_job_id: reference,
    contract_type: contract_type === "Contrat d'alternance (pro, apprentissage)" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : undefined,
    contract_remote: null,
    contract_duration: contract_duration?.min ? parseInt(contract_duration.min, 10) : null,
    offer_title: title,
    offer_description,
    offer_target_diploma: getDiplomaLevel(education_level),
    offer_desired_skills: skills,
    offer_access_conditions: [],
    offer_multicast: true,
    offer_to_be_acquired_skills: [],
    offer_rome_codes: undefined,
    offer_creation: published_at ? new Date(published_at) : null,
    offer_expiration: dayjs
      .tz(published_at || created_at)
      .add(2, "months")
      .toDate(),
    workplace_siret: null,
    workplace_name: brand?.name,
    workplace_description: brand?.description,
    workplace_address_label: address?.formatted,
    workplace_address_zipcode: address?.parts?.zip,
    workplace_address_city: address?.parts?.city,
    workplace_address_street_label: address?.parts?.street,
    workplace_geopoint:
      lat && lon
        ? {
            type: "Point",
            coordinates: [parseFloat(lon), parseFloat(lat)],
          }
        : undefined,
    apply_url: formatApplyUrl(apply_url),
  }
  return partnerJob
}

function getDiplomaLevel(value: string | null | undefined) {
  if (!value) return null
  const mapping = {
    "Aucun diplôme, CEP ou BEPC": "3",
    "CAP, BEP": "3",
    "Bac, bac professionnel": "4",
    "BTS, Bac+2": "5",
    "BUT, Licence, Bac+3": "6",
    "Maitrise, IEP, IUP, Bac+4": "6",
    "Master, Bac+5": "6",
    "Doctorat, Bac+8": "6",
  }
  const diplomeValue = mapping[value]
  const found = NIVEAUX_DIPLOMES_EUROPEENS.find((x) => x.value === diplomeValue)
  if (!found) return null
  return {
    european: found.value,
    label: found.label,
  }
}

function formatApplyUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const urlObj = new URL(url)
  urlObj.searchParams.append("s_o", "la-bonne-alternance")
  return urlObj.toString()
}
