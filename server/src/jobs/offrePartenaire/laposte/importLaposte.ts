import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawLaposteModel from "shared/models/rawLaposte.model"

import { laposteJobToJobsPartners, ZLaposteJob } from "./laposteMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawLaposteModel.collectionName
const offerXmlTag = "offre"

export const importLaposteRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
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
  })
}
