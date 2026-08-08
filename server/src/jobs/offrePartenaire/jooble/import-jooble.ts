import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawJoobleModel from "shared/models/raw-jooble.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/raw-to-computed-jobs-partners"
import { joobleJobToJobsPartners, ZJoobleJob } from "./jooble-mapper"

const rawCollectionName = rawJoobleModel.collectionName
const offerXmlTag = "job"

export const importJoobleRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.JOOBLE,
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
