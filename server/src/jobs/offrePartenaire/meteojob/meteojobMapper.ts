import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZMeteojobJob = z
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
      name: z.string(),
    }),
    workplace: z.object({
      locations: z.object({
        location: z.object({
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
        }),
      }),
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
    }),
    workSchedule: z
      .object({
        types: z.object({
          type: z.object({
            _: z.string(),
            $: z.object({ code: z.string() }),
          }),
        }),
      })
      .nullish(),
    benefits: z
      .object({
        salary: z.object({
          _: z.string(),
          $: z.object({ lowEnd: z.string(), currency: z.string(), period: z.string() }),
        }),
      })
      .nullish(),
    profile: z.object({
      description: z.string(),
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
    }),
  })
  .passthrough()

export type IMeteojobJob = z.output<typeof ZMeteojobJob>

export const meteojobJobToJobsPartners = (job: IMeteojobJob): IComputedJobsPartners => {
  const { $, title, description, link, publicationDate, lastModificationDate, position, industry, company, workplace, contract, workSchedule, benefits, profile } = job
  const { latitude, longitude } = geolocToLatLon(job)

  const urlParsing = extensions.url().safeParse(link)
  const creationDate = new Date(publicationDate)

  const created_at = new Date()

  const descriptionComputed = `${description}\r\n\r\n${industry ? `Secteur: ${industry}\r\n\r\n` : ""}${position ? `Poste: ${position}\r\n\r\n` : ""}${workSchedule ? `${workSchedule.types.type._}\r\n\r\n` : ""}${benefits ? `Avantages: ${benefits.salary._}\r\n\r\n` : ""}Profil: ${profile.description}`

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at,
    updated_at: lastModificationDate ? new Date(lastModificationDate) : created_at,
    partner_label: JOBPARTNERS_LABEL.METEOJOB,
    partner_job_id: $.id,

    offer_title: title,
    offer_description: descriptionComputed,
    offer_rome_codes: undefined,
    offer_creation: creationDate,

    offer_expiration: dayjs
      .tz(creationDate || created_at)
      .add(2, "months")
      .toDate(),

    workplace_name: company.name,
    workplace_description: company.description && company.description.length >= 30 ? company.description : null,
    workplace_address_zipcode: workplace?.locations?.location?.postalCode || null,
    workplace_address_city: workplace?.locations?.location?.city || null,
    workplace_address_label: workplace?.locations?.location?.$?.label || null,
    workplace_geopoint:
      latitude && longitude
        ? {
            type: "Point",
            coordinates: [longitude, latitude],
          }
        : undefined,
    contract_type:
      contract.types.type?._ === "Alternance / Apprentissage" ||
      (contract.types.type instanceof Array && contract.types.type.find((type) => type._ === "Alternance / Apprentissage"))
        ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
        : undefined,
    offer_desired_skills: [],
    offer_access_conditions: [],
    offer_multicast: true,
    offer_to_be_acquired_skills: [],
    apply_url: urlParsing.success ? urlParsing.data : null,
  }
  return partnerJob
}

const geolocToLatLon = (job: IMeteojobJob) => {
  const latitude = parseFloat(`${job.workplace.locations.location.$.lat}`)
  const longitude = parseFloat(`${job.workplace.locations.location.$.lng}`)
  return { latitude, longitude }
}
