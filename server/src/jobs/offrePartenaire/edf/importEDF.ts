import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawEdfModel from "shared/models/rawEdf.model"
import config from "@/config"
import { ZEnedisJob } from "@/jobs/offrePartenaire/enedis/enedisMapper"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"
import { edfJobToJobsPartners } from "./edfMapper"

const rawCollectionName = rawEdfModel.collectionName
const offerXmlTag = "offer"

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
    zodInput: ZEnedisJob, // same structure as Enedis, so we can reuse the same Zod schema
    mapper: edfJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
