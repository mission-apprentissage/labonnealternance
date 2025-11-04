import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawJoobleModel from "shared/models/rawJooble.model"

import { joobleJobToJobsPartners, ZJoobleJob } from "./joobleMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"


const rawCollectionName = rawJoobleModel.collectionName
const offerXmlTag = "job"

export const importJoobleRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      partnerLabel: JOBPARTNERS_LABEL.JOOBLE,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.joobleUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.JOOBLE,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importJoobleToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.JOOBLE,
    zodInput: ZJoobleJob,
    mapper: joobleJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
