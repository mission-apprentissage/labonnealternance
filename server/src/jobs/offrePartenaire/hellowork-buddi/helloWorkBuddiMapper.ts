import { ObjectId } from "mongodb"
import { joinNonNullStrings } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"
import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

export const ZHelloWorkBuddiJob = z
  .object({
    reference: z.string(),
    contract_start_date: z.string().nullish(),
    contract: z.string().nullish(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    benefits: z.string().nullish(),
    profile: z.string().nullish(),
    publication_date: z.string().nullish(),
    siret: z.string().nullish(),
    company_title: z.string().nullish(),
    company_description: z.string().nullish(),
    apply_mail: z.string().nullish(),
    city: z.string().nullish(),
    postal_code: z.string().nullish(),
    geoloc: z.string().nullish(),
    company_sector: z.string().nullish(),
  })
  .passthrough()

export type IHelloWorkBuddiJob = z.output<typeof ZHelloWorkBuddiJob>

export const helloWorkBuddiJobToJobsPartners = (job: IHelloWorkBuddiJob): IComputedJobsPartners => {
  const {
    reference,
    apply_mail,
    benefits,
    company_description,
    company_title,
    contract,
    contract_start_date,
    description,
    profile,
    publication_date,
    siret,
    title,
    city,
    postal_code: postalCodeRaw,
    geoloc,
    company_sector,
  } = job
  const { latitude, longitude } = geolocToLatLon(geoloc)
  const siretParsing = extensions.siret.safeParse(siret)
  const creationDate = parseDate(publication_date)

  const descriptionParts: string[] = []
  if (description) {
    descriptionParts.push(`## La mission\n${description}`)
  }
  if (benefits) {
    descriptionParts.push(`## Les avantages\n${benefits}`)
  }
  const finalDescription = descriptionParts.join("\n\n")

  const postalCode = postalCodeRaw?.length === 2 ? postalCodeRaw.padEnd(5, "0") : postalCodeRaw

  const now = new Date()
  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
    partner_job_id: reference,
    contract_start: parseDate(contract_start_date),
    contract_type: contract?.toLowerCase() === "alternance" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : undefined,
    offer_title: title,
    offer_description: finalDescription.length >= 30 ? finalDescription : undefined,
    offer_desired_skills: profile ? [profile] : [],
    offer_creation: creationDate,
    offer_expiration: dayjs
      .tz(creationDate || now)
      .add(2, "months")
      .toDate(),
    offer_multicast: false,
    workplace_siret: siretParsing.success ? siretParsing.data : null,
    workplace_name: company_title,
    workplace_description: company_description && company_description.length >= 30 ? company_description : null,
    workplace_address_label: joinNonNullStrings([city, postalCode]),
    workplace_address_zipcode: postalCode || null,
    workplace_address_city: city || null,
    workplace_geopoint:
      latitude && longitude
        ? {
            type: "Point",
            coordinates: [longitude, latitude],
          }
        : undefined,
    apply_email: apply_mail,

    offer_access_conditions: [],
    offer_to_be_acquired_skills: [],
    business_error: company_sector?.toLowerCase() === "enseignement/formation" ? BusinessErrorCodes.IS_CFA : null,
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

const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr) {
    return null
  }
  return dayjs.tz(dateStr).toDate()
}
