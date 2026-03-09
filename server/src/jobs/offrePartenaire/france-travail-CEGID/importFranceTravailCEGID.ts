import axios from "axios"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import z from "zod"

import rawFranceTravailCEGIDModel from "shared/models/rawFranceTravailCEGID.model"
import type { IFranceTravailCEGIDJob } from "./franceTravailCEGIDMapper"
import { franceTravailCEGIDMapper, ZCEGIDOfferDetail, ZFranceTravailCEGIDJob } from "./franceTravailCEGIDMapper"
import { parseAgences } from "./mappingAgences"
import { stringToStream } from "@/common/utils/streamUtils"
import config from "@/config"
import { importFromStreamInJson } from "@/jobs/offrePartenaire/importFromStreamInJson"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawFranceTravailCEGIDModel.collectionName

const ZJsonFile = z.object({
  data: z.array(ZFranceTravailCEGIDJob),
  _pagination: z
    .object({
      hasMore: z.boolean().optional(),
      links: z.array(
        z
          .object({
            href: z.string(),
            rel: z.string(),
          })
          .passthrough()
      ),
    })
    .passthrough(),
})

const ZTokenObject = z
  .object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
  })
  .passthrough()

const baseUrl = `${config.franceTravailCegidFlux.url}/api`

async function getOAuth2Token() {
  const sentData = {
    client_id: config.franceTravailCegidFlux.clientId,
    client_secret: config.franceTravailCegidFlux.clientSecret,
    grant_type: "client_credentials",
    scope: "MetaEngine",
  }
  const params = new URLSearchParams()
  Object.entries(sentData).forEach(([key, value]) => {
    params.append(key, value)
  })
  const response = await axios.post(`${baseUrl}/token`, params.toString())
  const json = response.data
  const { access_token } = ZTokenObject.parse(json)
  return access_token
}

const validContractTypes = ["CAP - Contrat d'apprentissage", "CDD - Contrat de professionnalisation"]

export const importFranceTravailCEGIDRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (!sourceStream) {
    const token = await getOAuth2Token()

    let offers: IFranceTravailCEGIDJob[] = []
    let nextSearchUrl: string | undefined = `${baseUrl}/V2/offersummaries?count=100`
    while (nextSearchUrl) {
      const searchResult = await searchCEGIDOffers(nextSearchUrl, token)
      nextSearchUrl = searchResult.nextUrl
      const selectedOffers = searchResult.offers.filter((offer) => validContractTypes.includes(offer.contractType?.label ?? ""))
      const enrichedOffers = await Promise.all(
        selectedOffers.map(async (offer) => {
          const detailLink = offer._links.find((link) => link.rel === "detail")
          if (detailLink) {
            offer.details = await getCEGIDOfferDetail(detailLink.href, token)
          }
          return offer
        })
      )
      offers = offers.concat(enrichedOffers)
    }

    sourceStream = stringToStream(JSON.stringify(offers))
  }
  await importFromStreamInJson({
    destinationCollection: rawCollectionName,
    stream: sourceStream!,
    partnerLabel: JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID,
    getOffers(json) {
      const parsed = z.array(ZFranceTravailCEGIDJob).parse(json)
      return parsed
    },
  })
}

export const importFranceTravailCEGIDToComputed = async () => {
  const agences = await parseAgences()
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID,
    zodInput: ZFranceTravailCEGIDJob,
    mapper: (job) => franceTravailCEGIDMapper(job, agences),
  })
}

export const processFranceTravailCEGID = async () => {
  await importFranceTravailCEGIDRaw()
  await importFranceTravailCEGIDToComputed()
}

async function searchCEGIDOffers(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch CEGID offers from ${url}: ${response.status} ${response.statusText}`)
  }
  const json = await response.json()
  const parsedJson = ZJsonFile.parse(json)
  const {
    data,
    _pagination: { links },
  } = parsedJson
  const nextUrl = links.find((link) => link.rel === "next")?.href
  return { nextUrl, offers: data }
}

async function getCEGIDOfferDetail(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch CEGID offer detail from ${url}: ${response.status} ${response.statusText}`)
  }
  const json = await response.json()
  const parseResult = ZCEGIDOfferDetail.safeParse(json)
  if (parseResult.success) {
    return parseResult.data
  } else {
    console.warn("Failed to parse CEGID offer detail", {
      url,
      error: parseResult.error,
    })
    return null
  }
}
