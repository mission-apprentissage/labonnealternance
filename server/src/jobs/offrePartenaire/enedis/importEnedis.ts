import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawEnedisModel from "shared/models/rawEnedis.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"
import { enedisJobToJobsPartners, ZEnedisJob } from "./enedisMapper"

const rawCollectionName = rawEnedisModel.collectionName
const offerXmlTag = "offer"

export const importEnedisRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.ENEDIS,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.enedisUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.ENEDIS,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importEnedisToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.ENEDIS,
    zodInput: ZEnedisJob,
    mapper: enedisJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
