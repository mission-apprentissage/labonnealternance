import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawMeteojobModel from "shared/models/rawMeteojob.model"

import config from "../../../config"
import { importFromStreamInXml } from "../importFromStreamInXml"
import { importFromUrlInXml } from "../importFromUrlInXml"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

import { meteojobJobToJobsPartners, ZMeteojobJob } from "./meteojobMapper"

const rawCollectionName = rawMeteojobModel.collectionName
const offerXmlTag = "job"

export const importMeteojobRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.METEOJOB })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.meteojobUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.METEOJOB })
  }
}

export const importMeteojobToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.METEOJOB,
    zodInput: ZMeteojobJob,
    mapper: meteojobJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
