import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawLeboncoinModel from "shared/models/rawLeboncoin.model"

import { leboncoinJobToJobsPartners, ZLeboncoinJob } from "./leboncoinMapper"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"
import config from "@/config"
import { importFromStreamInCsv } from "@/jobs/offrePartenaire/importFromStreamInCsv"
import { importFromUrlInCsv } from "@/jobs/offrePartenaire/importFromUrlInCsv"

const rawCollectionName = rawLeboncoinModel.collectionName
const documentJobRoot = "job"

export const importLeboncoin = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInCsv({
      destinationCollection: rawCollectionName,
      stream: sourceStream,
      partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
      parseOptions: { delimiter: "," },
    })
  } else {
    await importFromUrlInCsv({
      destinationCollection: rawCollectionName,
      url: config.leboncoinUrl,
      partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
      parseOptions: { delimiter: "," },
    })
  }
}

export const importLeboncoinToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
    zodInput: ZLeboncoinJob,
    mapper: leboncoinJobToJobsPartners,
    documentJobRoot,
  })
}
