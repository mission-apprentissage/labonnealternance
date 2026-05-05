import { ObjectId } from "mongodb"
import { parseEnum } from "shared"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"
import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import { getGeolocationFromCodeInsee } from "@/services/geolocation.service"
import type { IAgenceCEGID } from "./mappingAgences"
import { regionsToAgence } from "./mappingAgences"

export const ZCEGIDOfferDetail = z.object({
  customFields: z
    .object({
      offerCustomBlock4: z
        .object({
          customCodeTable2: z
            .object({
              clientCode: z.string().nullish(),
              type: z.string().nullish(),
            })
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
})

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
    _links: z.array(
      z
        .object({
          href: z.string(),
          rel: z.string(),
        })
        .passthrough()
    ),
    details: ZCEGIDOfferDetail.nullish(),
  })
  .passthrough()

enum CEGIDDurationCode {
  D12_mois = "12_mois",
  D18_mois = "18_mois",
  D24_mois = "24_mois",
  D3_mois = "3_mois",
  D6_mois = "6_mois",
  D9_mois = "9_mois",
  DUREE_A_DEFINIR = "DUREE_A_DEFINIR",
}

function CEGIDDurationToMonths(cegidEnum?: string): number | null {
  const enumValue = parseEnum(CEGIDDurationCode, cegidEnum)
  if (!enumValue) {
    return null
  }
  const mapping: Record<CEGIDDurationCode, number | null> = {
    [CEGIDDurationCode.D12_mois]: 12,
    [CEGIDDurationCode.D18_mois]: 18,
    [CEGIDDurationCode.D24_mois]: 24,
    [CEGIDDurationCode.D3_mois]: 3,
    [CEGIDDurationCode.D6_mois]: 6,
    [CEGIDDurationCode.D9_mois]: 9,
    [CEGIDDurationCode.DUREE_A_DEFINIR]: null,
  }
  return mapping[enumValue]
}

export type IFranceTravailCEGIDJob = z.output<typeof ZFranceTravailCEGIDJob>

export type FTCegidContext = {
  agences: IAgenceCEGID[]
}

export const franceTravailCEGIDMapper = async (job: IFranceTravailCEGIDJob, context: FTCegidContext): Promise<IComputedJobsPartners | null> => {
  const contract_duration = CEGIDDurationToMonths(job.details?.customFields?.offerCustomBlock4?.customCodeTable2?.clientCode ?? undefined)
  if (contract_duration !== null && contract_duration < 6) {
    return null
  }

  const now = dayjs.tz().toDate()
  const { reference, title, description1 = "", description2 = "", organisationDescription, offerUrl, startPublicationDate, beginningDate } = job
  const offerCreation = startPublicationDate ? dayjs.tz(startPublicationDate).toDate() : now
  const offerExpiration = dayjs.tz(offerCreation).add(60, "days").toDate()

  const contractTypes = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]

  const { city, zipcode } = await getLocality(job, context)

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
    contract_duration,

    workplace_siret: "13000548123699", // France travail
    workplace_name: "France Travail",
    workplace_description: organisationDescription || null,
    workplace_website: "https://www.francetravail.org/accueil/",

    workplace_address_city: city,
    workplace_address_zipcode: zipcode,
    workplace_address_label: [zipcode, city].filter((x) => x).join(" "),

    apply_url: offerUrl || null,
  }
  return partnerJob
}

async function agenceToLocality(agence: IAgenceCEGID) {
  const { GoogleRef: codeInseeRaw, Ville } = agence
  const codeInsee = codeInseeRaw.toString().padStart(5, "0")
  const apiAddress = await getGeolocationFromCodeInsee(Ville, codeInsee)
  const zipCodeOpt = apiAddress?.features?.at(0)?.properties?.postcode ?? undefined
  return {
    city: Ville,
    zipcode: zipCodeOpt ?? codeInsee,
  }
}

async function getLocality(job: IFranceTravailCEGIDJob, context: FTCegidContext): Promise<{ city: string; zipcode: string }> {
  const locality = (await getLocalityByAgence(job, context)) ?? (await getLocalityByDepartement(job, context)) ?? (await getLocalityByRegion(job, context))
  if (!locality) {
    throw new Error("locality not found")
  }
  return locality
}

async function getLocalityByAgence({ department }: IFranceTravailCEGIDJob, context: FTCegidContext): Promise<{ city: string; zipcode: string } | null> {
  const departmentId = department?.[0]?.clientCode // maille agence
  if (!departmentId) {
    return null
  }
  const { agences } = context
  const agence = agences.find((agence) => agence.ClientCode === departmentId)
  if (!agence) {
    throw new Error(`agence not found with department.clientCode=${departmentId}`)
  }
  return agenceToLocality(agence)
}

async function getLocalityByDepartement({ region }: IFranceTravailCEGIDJob, context: FTCegidContext): Promise<{ city: string; zipcode: string } | null> {
  const regionId = region?.[0]?.clientCode // maille département
  if (!regionId) {
    return null
  }
  const { agences } = context
  const agence = agences.find((agence) => agence.Region === regionId)
  if (!agence) {
    throw new Error(`agence not found with region.clientCode=${regionId}`)
  }
  return agenceToLocality(agence)
}

async function getLocalityByRegion({ country }: IFranceTravailCEGIDJob, context: FTCegidContext): Promise<{ city: string; zipcode: string } | null> {
  const countryId = country?.[0]?.clientCode // maille nouvelle région
  if (!countryId) {
    return null
  }
  const mappedAgenceId = regionsToAgence[countryId]
  if (!mappedAgenceId) {
    throw new Error(`missing mapping region to agence: regionId='${countryId}'`)
  }
  const { agences } = context
  const agence = agences.find((agence) => agence.ClientCode === mappedAgenceId)
  if (!agence) {
    throw new Error(`error in mapping. agence not found with clientCode='${mappedAgenceId}'`)
  }
  return agenceToLocality(agence)
}
