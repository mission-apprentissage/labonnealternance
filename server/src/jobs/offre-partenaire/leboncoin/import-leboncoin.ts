import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLeboncoinModel from "shared/models/raw-leboncoin.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInCsv } from "@/jobs/offre-partenaire/import-from-stream-in-csv"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { leboncoinJobToJobsPartners, ZLeboncoinJob } from "./leboncoin-mapper"

const rawCollectionName = rawLeboncoinModel.collectionName
const documentJobRoot = "job"

export const importLeboncoin = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInCsv({
    destinationCollection: rawCollectionName,
    stream: sourceStream,
    partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
    parseOptions: { delimiter: "," },
  })
}

export const leboncoinFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.leboncoinUrl),
}

export const importLeboncoinToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LEBONCOIN,
    zodInput: ZLeboncoinJob,
    mapper: leboncoinJobToJobsPartners,
    documentJobRoot,
  })
}
