import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawHelloWorkModel from "shared/models/rawHelloWork.model"

import { helloWorkJobToJobsPartners, ZHelloWorkJob } from "./helloWorkMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"


const rawCollectionName = rawHelloWorkModel.collectionName
const offerXmlTag = "job"

export const importHelloWorkRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.HELLOWORK })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.helloworkUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.HELLOWORK })
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
