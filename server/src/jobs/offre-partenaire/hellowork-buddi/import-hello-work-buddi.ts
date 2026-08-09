import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import rawHelloWorkBuddiModel from "shared/models/raw-hello-work-buddi.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { helloWorkBuddiJobToJobsPartners, ZHelloWorkBuddiJob } from "./hello-work-buddi-mapper"

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
