import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLaposteModel from "shared/models/raw-laposte.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { laposteJobToJobsPartners, ZLaposteJob } from "./laposte-mapper"

const rawCollectionName = rawLaposteModel.collectionName
const offerXmlTag = "offre"

export const importLaposteRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    return importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.LAPOSTE,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    return importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.laposteUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importLaposteToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
    zodInput: ZLaposteJob,
    mapper: laposteJobToJobsPartners,
    documentJobRoot: offerXmlTag,
    rawFilterQuery: { "offre.type-de-contrat": "Alternance" },
  })
}
