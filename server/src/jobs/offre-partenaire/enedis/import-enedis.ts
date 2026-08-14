import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEnedisModel from "shared/models/raw-enedis.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { enedisJobToJobsPartners, ZEnedisJob } from "./enedis-mapper"

const rawCollectionName = rawEnedisModel.collectionName
const offerXmlTag = "offer"

export const importEnedisRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    return importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.ENEDIS,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    return importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.enedisUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.ENEDIS,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importEnedisToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.ENEDIS,
    zodInput: ZEnedisJob,
    mapper: enedisJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
