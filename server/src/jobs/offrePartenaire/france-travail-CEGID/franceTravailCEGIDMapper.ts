import { ObjectId } from "mongodb"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import type { IAgenceCEGID } from "./mappingAgences"
import { regionsToAgence } from "./mappingAgences"
import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

export const ZFranceTravailCEGIDJob = z
  .object({
    reference: z.string(),
    title: z.string(),
    description1: z.string().nullish(),
    description2: z.string().nullish(),
    contractType: z
      .object({
        label: z.string(),
      })
      .nullish(),
    organisationName: z.string().nullish(),
    organisationDescription: z.string().nullish(),
    organisationLogoUrl: z.string().nullish(),
    salaryRange: z
      .object({
        label: z.string(),
      })
      .nullish(),
    offerUrl: z.string().nullish(),
    startPublicationDate: z.string().nullish(),
    beginningDate: z.string().nullish(),
    region: z
      .array(
        z
          .object({
            clientCode: z.string(),
          })
          .passthrough()
      )
      .nullish(),
    department: z
      .array(
        z
          .object({
            clientCode: z.string(),
          })
          .passthrough()
      )
      .nullish(),
    country: z
      .array(
        z
          .object({
            clientCode: z.string(),
          })
          .passthrough()
      )
      .nullish(),
  })
  .passthrough()

export type IFranceTravailCEGIDJob = z.output<typeof ZFranceTravailCEGIDJob>

export const franceTravailCEGIDMapper = (job: IFranceTravailCEGIDJob, agences: IAgenceCEGID[]): IComputedJobsPartners => {
  const now = dayjs.tz().toDate()
  const { reference, title, description1 = "", description2 = "", organisationName, organisationDescription, offerUrl, startPublicationDate, beginningDate } = job
  const offerCreation = startPublicationDate ? dayjs.tz(startPublicationDate).toDate() : now
  const offerExpiration = dayjs.tz(offerCreation).add(60, "days").toDate()

  const contractTypes = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]

  const { city, zipcode } = getLocality(job, agences)

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID,
    partner_job_id: reference,
    offer_title: title,
    offer_description: [description1, description2].filter((x) => x).join(" "),
    offer_creation: offerCreation,
    offer_expiration: offerExpiration,
    offer_opening_count: 1,
    offer_multicast: true,

    contract_type: contractTypes,
    contract_start: beginningDate ? new Date(beginningDate) : null,

    workplace_siret: "13000548123699", // France travail
    workplace_name: organisationName || null,
    workplace_description: organisationDescription || null,
    workplace_website: "https://www.francetravail.fr/",

    workplace_address_city: city,
    workplace_address_zipcode: zipcode,
    workplace_address_label: [zipcode, city].filter((x) => x).join(" "),

    apply_url: offerUrl || null,
  }
  return partnerJob
}

function agenceToLocality(agence: IAgenceCEGID) {
  const { GoogleRef, Ville } = agence
  const zipcode = GoogleRef.toString().padStart(5, "0")
  return {
    city: Ville,
    zipcode,
  }
}

function getLocality(job: IFranceTravailCEGIDJob, agences: IAgenceCEGID[]): { city: string; zipcode: string } {
  const locality = getLocalityByAgence(job, agences) ?? getLocalityByDepartement(job, agences) ?? getLocalityByRegion(job, agences)
  if (!locality) {
    throw new Error("locality not found")
  }
  return locality
}

function getLocalityByAgence({ department }: IFranceTravailCEGIDJob, agences: IAgenceCEGID[]): { city: string; zipcode: string } | null {
  const departmentId = department?.[0]?.clientCode // maille agence
  if (!departmentId) {
    return null
  }
  const agence = agences.find((agence) => agence.ClientCode === departmentId)
  if (!agence) {
    throw new Error(`agence not found with department.clientCode=${departmentId}`)
  }
  return agenceToLocality(agence)
}

function getLocalityByDepartement({ region }: IFranceTravailCEGIDJob, agences: IAgenceCEGID[]): { city: string; zipcode: string } | null {
  const regionId = region?.[0]?.clientCode // maille département
  if (!regionId) {
    return null
  }

  const agence = agences.find((agence) => agence.Region === regionId)
  if (!agence) {
    throw new Error(`agence not found with region.clientCode=${regionId}`)
  }
  return agenceToLocality(agence)
}

function getLocalityByRegion({ country }: IFranceTravailCEGIDJob, agences: IAgenceCEGID[]): { city: string; zipcode: string } | null {
  const countryId = country?.[0]?.clientCode // maille nouvelle région
  if (!countryId) {
    return null
  }
  const mappedAgenceId = regionsToAgence[countryId]
  if (!mappedAgenceId) {
    throw new Error(`missing mapping region to agence: regionId='${countryId}'`)
  }
  const agence = agences.find((agence) => agence.ClientCode === mappedAgenceId)
  if (!agence) {
    throw new Error(`error in mapping. agence not found with clientCode='${mappedAgenceId}'`)
  }
  return agenceToLocality(agence)
}
