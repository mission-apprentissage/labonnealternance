import axios from "axios"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawDecathlonModel from "shared/models/raw-decathlon.model"
import z from "zod"
import config from "@/config"
import { importFromStreamInJson } from "@/jobs/offre-partenaire/import-from-stream-in-json"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { decathlonJobToJobsPartners, ZDecathlonJob } from "./decathlon-mapper"

const rawCollectionName = rawDecathlonModel.collectionName

const ZJsonFile = z.looseObject({
  ads: z.array(ZDecathlonJob),
})

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
    partnerLabel: JOBPARTNERS_LABEL.DECATHLON,
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

export const processDecathlon = async () => {
  await importDecathlonRaw()
  await importDecathlonToComputed()
}
