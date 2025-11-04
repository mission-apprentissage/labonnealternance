import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawKelioModel from "shared/models/rawKelio.model"

import { kelioJobToJobsPartners, ZKelioJob } from "./kelioMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawKelioModel.collectionName
const offerXmlTag = "job"

export const importKelioRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      partnerLabel: JOBPARTNERS_LABEL.KELIO,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.kelioUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.KELIO,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importKelioToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.KELIO,
    zodInput: ZKelioJob,
    mapper: kelioJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
