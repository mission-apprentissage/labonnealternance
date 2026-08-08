import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEnedisModel from "shared/models/raw-enedis.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/raw-to-computed-jobs-partners"
import { enedisJobToJobsPartners, ZEnedisJob } from "./enedis-mapper"

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
