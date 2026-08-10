import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEdfModel from "shared/models/raw-edf.model"
import config from "@/config"
import { ZEnedisJob } from "@/jobs/offre-partenaire/enedis/enedis-mapper"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { edfJobToJobsPartners } from "./edf-mapper"

const rawCollectionName = rawEdfModel.collectionName
const offerXmlTag = "offer"

export const importEdfRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    return importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.EDF,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    return importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.edfUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.EDF,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importEdfToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.EDF,
    zodInput: ZEnedisJob, // same structure as Enedis, so we can reuse the same Zod schema
    mapper: edfJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
