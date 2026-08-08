import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLeboncoinModel from "shared/models/raw-leboncoin.model"
import config from "@/config"
import { importFromStreamInCsv } from "@/jobs/offrePartenaire/importFromStreamInCsv"
import { importFromUrlInCsv } from "@/jobs/offrePartenaire/importFromUrlInCsv"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"
import { leboncoinJobToJobsPartners, ZLeboncoinJob } from "./leboncoinMapper"

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
