import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

//const rawCollectionName = rawEdf.collectionName
const rawCollectionName = "raw_edf"
const offerXmlTag = "job"

export const importEdfRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.EDF,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.edfUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.EDF,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importEdfToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.EDF,
    zodInput: ZEdfJob,
    mapper: edfJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
