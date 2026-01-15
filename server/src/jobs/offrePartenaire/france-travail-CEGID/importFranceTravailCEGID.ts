import axios from "axios"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import z from "zod"

import rawFranceTravailCEGIDModel from "shared/models/rawFranceTravailCEGID.model"
import type { IFranceTravailCEGIDJob } from "./franceTravailCEGIDMapper"
import { franceTravailCEGIDMapper, ZFranceTravailCEGIDJob } from "./franceTravailCEGIDMapper"
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

export const importFranceTravailCEGIDRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (!sourceStream) {
    const token = await getOAuth2Token()

    async function getCEGIDOffers(url: string) {
      const response = await fetch(url, {
        headers: {
          Authorization: `bearer ${token}`,
        },
      })
      const json = await response.json()
      const parsedJson = ZJsonFile.parse(json)
      const {
        data,
        _pagination: { links },
      } = parsedJson
      const nextUrl = links.find((link) => link.rel === "next")?.href
      return { nextUrl, offers: data }
    }
    let offers: IFranceTravailCEGIDJob[] = []
    let nextUrl: string | undefined = `${baseUrl}/V2/offersummaries?count=100`
    while (nextUrl) {
      const result = await getCEGIDOffers(nextUrl)
      nextUrl = result.nextUrl
      offers = offers.concat(result.offers)
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
