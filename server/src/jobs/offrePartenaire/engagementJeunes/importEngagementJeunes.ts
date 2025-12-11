import axios from "axios"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import z from "zod"

import { rawEngagementJeunesModel } from "shared/models/rawEngagementJeunes.model"
import { engagementJeunesJobToJobsPartners, ZEngagementJeunesJob } from "./engagementJeunesMapper"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"
import config from "@/config"
import { importFromStreamInJson } from "@/jobs/offrePartenaire/importFromStreamInJson"

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
