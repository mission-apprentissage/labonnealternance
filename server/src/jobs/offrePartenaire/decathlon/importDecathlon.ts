import axios from "axios"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawDecathlonModel from "shared/models/rawDecathlon.model"
import z from "zod"

import { decathlonJobToJobsPartners, ZDecathlonJob } from "./decathlonMapper"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"
import config from "@/config"
import { importFromStreamInJson } from "@/jobs/offrePartenaire/importFromStreamInJson"

const rawCollectionName = rawDecathlonModel.collectionName

const ZJsonFile = z
  .object({
    ads: z.array(ZDecathlonJob),
  })
  .passthrough()

export const importDecathlonRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (!sourceStream) {
    const response = await axios.get(config.decathlonUrl, {
      responseType: "stream",
    })
    sourceStream = response.data
  }
  await importFromStreamInJson({
    destinationCollection: rawCollectionName,
    stream: sourceStream!,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
    getOffers(json) {
      const parsed = ZJsonFile.parse(json)
      return parsed.ads
    },
  })
}

export const importDecathlonToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.DECATHLON,
    zodInput: ZDecathlonJob,
    mapper: decathlonJobToJobsPartners,
  })
}
