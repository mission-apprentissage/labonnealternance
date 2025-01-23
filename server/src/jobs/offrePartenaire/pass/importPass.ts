import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawPassModel from "shared/models/rawPass.model"

import config from "../../../config"
import { importFromStreamInXml } from "../importFromStreamInXml"
import { importFromUrlInXml } from "../importFromUrlInXml"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

import { passJobToJobsPartners, ZPassJob } from "./passMapper"

const rawCollectionName = rawPassModel.collectionName
const offerXmlTag = "item"

export const importPassRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.PASS })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.passUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.PASS })
  }
}

export const importPassToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.PASS,
    zodInput: ZPassJob,
    mapper: passJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
