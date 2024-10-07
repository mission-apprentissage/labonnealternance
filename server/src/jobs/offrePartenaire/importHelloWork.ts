import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { helloWorkJobToJobsPartners, ZHelloWorkJob } from "./helloWorkMapper"
import { importFromStreamInXml } from "./importFromStreamInXml"
import { importFromUrlInXml } from "./importFromUrlInXml"
import { rawToComputedJobsPartners } from "./rawToComputedJobsPartners"

const rawCollectionName = "raw_hellowork" as const
const offerXmlTag = "job"

export const importHelloWorkRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: "plop", offerXmlTag })
  }
}

export const importHelloWorkToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
    zodInput: ZHelloWorkJob,
    mapper: helloWorkJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
