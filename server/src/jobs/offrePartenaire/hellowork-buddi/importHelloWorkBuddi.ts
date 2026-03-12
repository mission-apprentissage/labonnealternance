import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import rawHelloWorkBuddiModel from "shared/models/rawHelloWorkBuddi.model"
import { helloWorkBuddiJobToJobsPartners, ZHelloWorkBuddiJob } from "./helloWorkBuddiMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawHelloWorkBuddiModel.collectionName
const offerXmlTag = "job"

export const importHelloWorkBuddiRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.helloworkBuddiUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importHelloWorkBuddiToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
    zodInput: ZHelloWorkBuddiJob,
    mapper: helloWorkBuddiJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
