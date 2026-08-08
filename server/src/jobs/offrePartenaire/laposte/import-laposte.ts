import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLaposteModel from "shared/models/raw-laposte.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/raw-to-computed-jobs-partners"
import { laposteJobToJobsPartners, ZLaposteJob } from "./laposte-mapper"

const rawCollectionName = rawLaposteModel.collectionName
const offerXmlTag = "offre"

export const importLaposteRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.LAPOSTE,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.laposteUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importLaposteToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
    zodInput: ZLaposteJob,
    mapper: laposteJobToJobsPartners,
    documentJobRoot: offerXmlTag,
    rawFilterQuery: { "offre.type-de-contrat": "Alternance" },
  })
}
