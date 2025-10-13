import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawLeboncoinModel from "shared/models/rawLeboncoin.model"

// import config from "../../../config"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

import { leboncoinJobToJobsPartners, ZLeboncoinJob } from "./leboncoinMapper"

const rawCollectionName = rawLeboncoinModel.collectionName
const offerXmlTag = "offre"

export const importLeboncoin = async (sourceStream?: NodeJS.ReadableStream) => {
  // TODO : ici csv
  if (sourceStream) {
    //   await importFromStreamInXml({
    //     destinationCollection: rawCollectionName,
    //     offerXmlTag,
    //     stream: sourceStream,
    //     partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
    //     conflictingOpeningTagWithoutAttributes: true,
    //   })
  } else {
    //   await importFromUrlInXml({
    //     destinationCollection: rawCollectionName,
    //     url: config.laposteUrl,
    //     offerXmlTag,
    //     partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
    //     conflictingOpeningTagWithoutAttributes: true,
    //   })
  }
}

export const importLeboncoinToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
    zodInput: ZLeboncoinJob,
    mapper: leboncoinJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
