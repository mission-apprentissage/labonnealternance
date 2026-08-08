import axios from "axios"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { rawEngagementJeunesModel } from "shared/models/raw-engagement-jeunes.model"
import z from "zod"
import config from "@/config"
import { importFromStreamInJson } from "@/jobs/offrePartenaire/import-from-stream-in-json"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/raw-to-computed-jobs-partners"
import { engagementJeunesJobToJobsPartners, ZEngagementJeunesJob } from "./engagement-jeunes-mapper"

const rawCollectionName = rawEngagementJeunesModel.collectionName

const ZJsonFile = z.array(ZEngagementJeunesJob)

export const importEngagementJeunesRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (!sourceStream) {
    const response = await axios.get(config.engagementJeunesFluxUrl, {
      responseType: "stream",
    })
    sourceStream = response.data
  }
  await importFromStreamInJson({
    destinationCollection: rawCollectionName,
    stream: sourceStream!,
    partnerLabel: JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES,
    getOffers(json) {
      return ZJsonFile.parse(json)
    },
  })
}

export const importEngagementJeunesToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.ENGAGEMENT_JEUNES,
    zodInput: ZEngagementJeunesJob,
    mapper: engagementJeunesJobToJobsPartners,
  })
}

export const processEngagementJeunes = async () => {
  await importEngagementJeunesRaw()
  await importEngagementJeunesToComputed()
}
