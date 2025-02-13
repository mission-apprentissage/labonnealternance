import { ObjectId } from "bson"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { removeHtmlTagsFromString } from "../../../common/utils/stringUtils"
import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZPassJob = z
  .object({
    title: z.object({
      a: z
        .object({
          _: z.string().nullish(),
        })
        .passthrough(),
    }),
    link: z.string().nullish(),
    description: z.string().nullish(),
    author: z.string().nullish(),
    pubDate: z.string().nullish(),
    "dc:identifier": z.string(),
    "dc:description": z.string().nullish(),
    "dc:publisher": z.string().nullish(),
    "dc:contributor": z.string().nullish(),
    "dc:date": z.string().nullish(),
    "dc:type": z.string().nullish(),
    "dc:format": z.string().nullish(),
    "dc:coverage": z.string().nullish(),
  })
  .passthrough()

export type IPassJob = z.output<typeof ZPassJob>

export const passJobToJobsPartners = (job: IPassJob): IComputedJobsPartners => {
  const { link, description, author, pubDate } = job
  const title = job.title.a._
  const dcIdentifier = job["dc:identifier"]
  const dcDescription = job["dc:description"]
  const dcDate = job["dc:date"]
  const dcType = job["dc:type"]
  const dcFormat = job["dc:format"]
  const dcCoverage = job["dc:coverage"]

  const now = new Date()
  const creationDate = parseDate(pubDate)
  const contractDuration = parseDuration(dcFormat)
  const contractStart = parseDate(dcDate)
  const offerExpiration = dayjs.tz(contractStart).add(2, "months").toDate()
  let businessError: null | JOB_PARTNER_BUSINESS_ERROR = null

  if (contractDuration === 0) {
    businessError = JOB_PARTNER_BUSINESS_ERROR.STAGE
  }

  if (contractStart) {
    if (offerExpiration <= now) {
      businessError = JOB_PARTNER_BUSINESS_ERROR.EXPIRED
    }
  }

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: now,
    updated_at: now,
    partner_label: JOBPARTNERS_LABEL.PASS,
    partner_job_id: dcIdentifier,
    contract_type: ["Apprentissage"],
    contract_start: contractStart,
    contract_duration: contractDuration,
    offer_title: title,
    offer_description: removeHtmlTagsFromString(description),
    offer_target_diploma: parseDiploma(dcType),
    offer_creation: creationDate,
    offer_expiration: offerExpiration,
    offer_opening_count: 1,
    offer_multicast: true,
    workplace_name: author,
    workplace_address_label: `${dcCoverage} ${dcDescription}`,
    apply_url: link,
    business_error: businessError,
  }
  return partnerJob
}

function parseDate(dateStr: string | null | undefined) {
  if (!dateStr) {
    return null
  }
  return dayjs.tz(dateStr).toDate()
}

function parseDuration(field) {
  const stagePatterns = [/^Entre\s+1\s+et\s+2\s+mois$/, /^Entre\s+4\s+et\s+6\s+mois$/]

  // Vérifie si le champ correspond à un stage
  if (stagePatterns.some((pattern) => pattern.test(field))) {
    return 0 // do not import stage
  }

  const regexSingle = /^(\d+)\s+mois$/
  const regexRange = /^Entre\s+(\d+)\s+et\s+(\d+)\s+mois$/

  let match
  if ((match = field.match(regexSingle))) {
    return parseInt(match[1], 10)
  } else if ((match = field.match(regexRange))) {
    const min = parseInt(match[1], 10)

    if (min === 6 || min === 12 || min === 24) {
      return min
    }
  }
  return null
}

function parseDiploma(field) {
  const diplomaLevels = {
    "Niveau 3": "3", // CAP, BEP
    "Niveau 4": "4", // BAC
    "Niveau 5": "5", // Bac+2
    "Niveau 6": "6", // Bac+3 ou 4
    "Niveau 7": "7", // Bac+5 et plus
  }

  const diplomaLabels = {
    "Niveau 3": "Cap, autres formations niveau (Infrabac)",
    "Niveau 4": "BP, Bac, autres formations niveau (Bac)",
    "Niveau 5": "BTS, DEUST, autres formations niveau (Bac+2)",
    "Niveau 6": "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)",
    "Niveau 7": "Master, titre ingénieur, autres formations niveau (Bac+5)",
  }

  for (const pattern of Object.keys(diplomaLevels)) {
    if (field.startsWith(pattern)) {
      return {
        european: diplomaLevels[pattern],
        label: diplomaLabels[pattern],
      }
    }
  }

  return null
}
