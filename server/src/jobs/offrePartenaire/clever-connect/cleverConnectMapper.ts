import { isArray } from "lodash-es"
import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants/index"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import type { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

const ZCleverConnectjobJobLocation = z.object({
  $: z.object({
    label: z.string(),
    lat: z.string().nullish(),
    lng: z.string().nullish(),
  }),
  city: z.string().nullish(),
  postalCode: z.string().nullish(),
  department: z.object({ _: z.string(), $: z.object({ code: z.string() }) }).nullish(),
  state: z.object({ _: z.string(), $: z.object({ code: z.string() }) }).nullish(),
  country: z.object({ _: z.string(), $: z.object({ code: z.string() }) }),
})
type ICleverConnectjobJobLocation = z.output<typeof ZCleverConnectjobJobLocation>

const CONTRAT_ALTERNANCE = "Alternance / Apprentissage"

export const ZCleverConnectJob = z
  .object({
    $: z.object({ id: z.string(), reference: z.string(), lang: z.string().nullish() }),
    title: z.string(),
    description: z.string(),
    link: z.string(),
    publicationDate: z.string(),
    lastModificationDate: z.string(),
    position: z.string().nullish(),
    industry: z.string().nullish(),
    company: z.object({
      $: z.object({ id: z.string(), anonymous: z.string() }),
      description: z.string().nullish(),
      name: z.string().nullish(),
    }),
    workplace: z.object({
      locations: z.object({
        location: z.union([ZCleverConnectjobJobLocation, z.array(ZCleverConnectjobJobLocation)]),
      }),
      remote: z
        .object({
          _: z.string(),
          $: z.object({ code: z.string() }),
        })
        .nullish(),
    }),
    contract: z.object({
      types: z.object({
        type: z.union([
          z.object({
            _: z.string(),
            $: z.object({ code: z.string() }),
          }),
          z.array(
            z.object({
              _: z.string(),
              $: z.object({ code: z.string() }),
            })
          ),
        ]),
      }),
      length: z
        .object({
          _: z.string(),
          $: z.object({ value: z.string(), unit: z.string() }),
        })
        .nullish(),
      startDate: z.string().nullish(),
    }),
    workSchedule: z
      .object({
        types: z.object({
          type: z.union([
            z.array(
              z.object({
                _: z.string(),
                $: z.object({ code: z.string() }),
              })
            ),
            z.object({
              _: z.string(),
              $: z.object({ code: z.string() }),
            }),
          ]),
        }),
      })
      .nullish(),
    benefits: z
      .union([
        z.object({
          salary: z
            .object({
              _: z.string(),
              $: z
                .object({
                  lowEnd: z.string().optional(),
                  currency: z.string().optional(),
                  period: z.string().optional(),
                })
                .optional(),
            })
            .nullish(),
          description: z.string().nullish(),
        }),
        z.string(),
      ])
      .nullish(),
    profile: z
      .object({
        description: z.string().nullish(),
        degrees: z
          .object({
            degree: z.union([
              z.object({
                _: z.string(),
                $: z.object({ code: z.string() }),
              }),
              z.array(
                z.object({
                  _: z.string(),
                  $: z.object({ code: z.string() }),
                })
              ),
            ]),
          })
          .nullish(),
        experienceLevels: z
          .object({
            experienceLevel: z.union([
              z.object({
                _: z.string(),
                $: z.object({ code: z.string() }),
              }),
              z.array(
                z.object({
                  _: z.string(),
                  $: z.object({ code: z.string() }),
                })
              ),
            ]),
          })
          .nullish(),
      })
      .nullable(),
  })
  .passthrough()

export type ICleverConnectJob = z.output<typeof ZCleverConnectJob>

export const cleverConnectJobToJobsPartners = (job: ICleverConnectJob, partner_label: JOBPARTNERS_LABEL): IComputedJobsPartners => {
  const { $, title, link, publicationDate, lastModificationDate, company } = job
  const startDate = job.contract.startDate && job.contract.startDate.endsWith("Z") ? new Date(job.contract.startDate.slice(0, -1)) : null
  const workplaceLocation = isArray(job.workplace.locations.location) ? job.workplace.locations.location[0] : job.workplace.locations.location
  const workplace_geopoint = geolocToLatLon(workplaceLocation)

  const urlParsing = extensions.url().safeParse(link)
  const creationDate = new Date(publicationDate)

  const created_at = new Date()

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at,
    updated_at: lastModificationDate ? new Date(lastModificationDate) : created_at,
    partner_label: partner_label,
    partner_job_id: $.id,

    offer_title: title,
    offer_description: getOfferDescription(job),
    offer_creation: creationDate,
    offer_expiration: dayjs(creationDate || created_at)
      .tz()
      .add(2, "months")
      .toDate(),
    offer_multicast: true,
    offer_to_be_acquired_skills: [],
    offer_desired_skills: [],
    offer_access_conditions: getAccessConditions(job),
    offer_target_diploma: getOfferTargetDiploma(job),

    workplace_name: company?.name || null,
    workplace_description: company.description && company.description.length >= 30 ? company.description : null,
    workplace_address_zipcode: workplaceLocation?.postalCode || null,
    workplace_address_city: workplaceLocation.city || null,
    workplace_address_label: workplaceLocation.$?.label || null,
    workplace_geopoint,

    contract_type: getContratType(job),
    contract_duration: getContractDuration(job),
    contract_remote: getRemoteStatus(job),
    contract_start: startDate,

    apply_url: urlParsing.success ? urlParsing.data : null,
  }
  return partnerJob
}

const getAccessConditions = (job: ICleverConnectJob): IComputedJobsPartners["offer_access_conditions"] => {
  if (!job.profile?.experienceLevels) return []
  return isArray(job.profile.experienceLevels.experienceLevel) ? job.profile.experienceLevels.experienceLevel.map((l) => l._) : [job.profile.experienceLevels.experienceLevel._]
}

const getContratType = (job: ICleverConnectJob): IComputedJobsPartners["contract_type"] => {
  const cleverConnectContratType = isArray(job.contract.types.type) ? job.contract.types.type : [job.contract.types.type]
  const contratType = cleverConnectContratType.some((type) => type._ === CONTRAT_ALTERNANCE)
  if (contratType) return [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  return undefined
}

const getContractDuration = (job: ICleverConnectJob): IComputedJobsPartners["contract_duration"] => {
  const cleverConnectContractDuration = job.contract?.length?.$.value
  const cleverConnectContractDurationUnit = job.contract?.length?.$.unit
  if (!cleverConnectContractDuration || !cleverConnectContractDurationUnit) return null
  switch (cleverConnectContractDurationUnit) {
    case "year":
      return parseInt(cleverConnectContractDuration) * 12
    case "month":
      return parseInt(cleverConnectContractDuration)
    case "week":
      return Math.round((parseInt(cleverConnectContractDuration) * 7) / (365 / 12))
    default:
      break
  }
}

const getRemoteStatus = (job: ICleverConnectJob): IComputedJobsPartners["contract_remote"] => {
  const cleverConnectRemoteStatus = job.workplace.remote?.$.code
  if (!cleverConnectRemoteStatus) return null
  switch (cleverConnectRemoteStatus) {
    case "full":
      return TRAINING_REMOTE_TYPE.remote
    case "occasional":
      return TRAINING_REMOTE_TYPE.hybrid
    case "none":
      return TRAINING_REMOTE_TYPE.onsite
    default:
      break
  }
}

const geolocToLatLon = (location: ICleverConnectjobJobLocation): IComputedJobsPartners["workplace_geopoint"] => {
  const { lat, lng } = location.$
  if (!lat || !lng) return null
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  return {
    type: "Point",
    coordinates: [longitude, latitude],
  }
}

const CleverConnectDegreeMap: Record<string, IComputedJobsPartners["offer_target_diploma"]> = {
  bepc: { european: "3", label: "Cap, autres formations (Infrabac)" },
  bep: { european: "3", label: "Cap, autres formations (Infrabac)" },
  cap: { european: "3", label: "Cap, autres formations (Infrabac)" },
  cqp: { european: "3", label: "Cap, autres formations (Infrabac)" },
  bp: { european: "4", label: "BP, Bac, autres formations (Bac)" },
  bac_pro: { european: "4", label: "BP, Bac, autres formations (Bac)" },
  bac: { european: "4", label: "BP, Bac, autres formations (Bac)" },
  "bac+1": { european: "4", label: "BP, Bac, autres formations (Bac)" },
  "bac+2": { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  deug: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  bts: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  dma: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  "bac+3": { european: "6", label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)" },
  license: { european: "6", label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)" },
  "bac+4": { european: "6", label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)" },
  maitrise: { european: "6", label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)" },
  "bac+5": { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  dea: { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  master: { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  business: { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  engineering: { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  mastere: { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  phd: { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  "bac+7": { european: "7", label: "Master, titre ingénieur, autres formations (Bac+5)" },
  gcse_o_level: { european: "3", label: "Cap, autres formations (Infrabac)" },
  a_level: { european: "4", label: "BP, Bac, autres formations (Bac)" },
  t_level: { european: "4", label: "BP, Bac, autres formations (Bac)" },
  btec_l3: { european: "4", label: "BP, Bac, autres formations (Bac)" },
  btec: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  dhe: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  foundation: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
  pgce: { european: "6", label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)" },
  cert_he: { european: "5", label: "BTS, DEUST, autres formations (Bac+2)" },
}

const getOfferTargetDiploma = (job: ICleverConnectJob): IComputedJobsPartners["offer_target_diploma"] => {
  if (!job.profile?.degrees) return null
  const cleverConnectDegreeCode = isArray(job.profile.degrees.degree) ? job.profile.degrees.degree[0].$.code : job.profile.degrees.degree.$.code
  if (cleverConnectDegreeCode === "none") return null
  return CleverConnectDegreeMap[cleverConnectDegreeCode]
}

const getOfferDescription = (job: ICleverConnectJob): IComputedJobsPartners["offer_description"] => {
  const { description, industry, position, workSchedule, benefits, profile } = job

  let descriptionComputed = `${description}\r\n\r\n`

  if (industry) {
    descriptionComputed += `Secteur: ${industry}\r\n\r\n`
  }
  if (position) {
    descriptionComputed += `Poste: ${position}\r\n\r\n`
  }
  const workScheduleTypes = workSchedule?.types?.type
  if (workScheduleTypes) {
    if (Array.isArray(workScheduleTypes)) {
      descriptionComputed += `${workScheduleTypes.map((type) => type._).join(", ")}\r\n\r\n`
    } else if (typeof workScheduleTypes === "object") {
      descriptionComputed += `${workScheduleTypes._}\r\n\r\n`
    }
  }
  if (typeof benefits === "string") {
    descriptionComputed += `Avantages: ${benefits}\r\n\r\n`
  } else {
    if (benefits?.salary?._) {
      descriptionComputed += `Avantages: ${benefits.salary._}\r\n\r\n`
    }
    if (benefits?.description) {
      descriptionComputed += `${benefits.description}\r\n\r\n`
    }
  }
  if (profile?.description) {
    descriptionComputed += `Profil: ${profile.description}`
  }

  return descriptionComputed.trim()
}
