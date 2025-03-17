import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { removeHtmlTagsFromString } from "@/common/utils/stringUtils"

import { isCompanyInBlockedCfaList } from "../blockJobsPartnersFromCfaList"
import { blankComputedJobPartner } from "../fillComputedJobsPartners"

const ZMeteojobJobLocation = z.object({
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
type IMeteojobJobLocation = z.output<typeof ZMeteojobJobLocation>

const CONTRAT_ALTERNANCE = "Alternance / Apprentissage"

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
        location: z.union([ZMeteojobJobLocation, z.array(ZMeteojobJobLocation)]),
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
      length: z
        .object({
          _: z.string(),
          $: z.object({ value: z.string(), unit: z.string() }),
        })
        .nullish(),
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
        salary: z
          .object({
            _: z.string(),
            $: z.object({ lowEnd: z.string(), currency: z.string(), period: z.string() }),
          })
          .nullish(),
        description: z.string().nullish(),
      })
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

export type IMeteojobJob = z.output<typeof ZMeteojobJob>

const sanitizeHtml = (text: string) => {
  let sanitizedText = text.replace("<p>", "\r\n").replace("</p>", "\r\n").replace("<br>", "\r\n").replace("<br/>", "\r\n").replace("<br />", "\r\n")
  sanitizedText = removeHtmlTagsFromString(sanitizedText) as string
  return sanitizedText.trim()
}

export const meteojobJobToJobsPartners = (job: IMeteojobJob): IComputedJobsPartners => {
  const { $, title, description, link, publicationDate, lastModificationDate, position, industry, company, contract, workSchedule, benefits, profile } = job
  const workplaceLocation = job.workplace.locations.location instanceof Array ? job.workplace.locations.location[0] : job.workplace.locations.location
  const workplace_geopoint = geolocToLatLon(workplaceLocation)

  const urlParsing = extensions.url().safeParse(link)
  const creationDate = new Date(publicationDate)

  const created_at = new Date()

  let descriptionComputed = `${description}\r\n\r\n${industry ? `Secteur: ${industry}\r\n\r\n` : ""}
  ${position ? `Poste: ${position}\r\n\r\n` : ""}
  ${workSchedule ? `${workSchedule.types.type._}\r\n\r\n` : ""}
  ${benefits ? `Avantages: ${benefits?.salary?._ ? benefits.salary._ : ""}\r\n\r\n` : ""}${benefits?.description ? `${benefits.description}\r\n\r\n` : ""}
  ${profile?.description ? `Profil: ${profile.description}` : ""}`

  descriptionComputed = sanitizeHtml(descriptionComputed)

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
    workplace_description: company.description && company.description.length >= 30 ? sanitizeHtml(company.description) : null,
    workplace_address_zipcode: workplaceLocation?.postalCode || null,
    workplace_address_city: workplaceLocation.city || null,
    workplace_address_label: workplaceLocation.$?.label || null,
    workplace_geopoint,
    contract_type:
      (!(contract.types.type instanceof Array) && contract.types.type?._ === CONTRAT_ALTERNANCE) ||
      (contract.types.type instanceof Array && contract.types.type.find((type) => type._ === CONTRAT_ALTERNANCE))
        ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
        : undefined,
    contract_duration: contract?.length?.$?.value ? parseInt(contract.length.$.value) : null,
    offer_desired_skills: [],
    offer_access_conditions:
      profile?.experienceLevels?.experienceLevel instanceof Array
        ? profile?.experienceLevels?.experienceLevel?.map((l) => l._)
        : profile?.experienceLevels?.experienceLevel?._
          ? [profile.experienceLevels.experienceLevel._]
          : [],
    offer_multicast: true,
    offer_to_be_acquired_skills: [],
    apply_url: urlParsing.success ? urlParsing.data : null,
    business_error: isCompanyInBlockedCfaList(company.name) ? JOB_PARTNER_BUSINESS_ERROR.CFA : null,
  }
  return partnerJob
}

const geolocToLatLon = (location: IMeteojobJobLocation): IComputedJobsPartners["workplace_geopoint"] => {
  const { lat, lng } = location.$
  if (!lat || !lng) return null
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  return {
    type: "Point",
    coordinates: [longitude, latitude],
  }
}
