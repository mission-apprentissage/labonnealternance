import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEnedisModel from "shared/models/raw-enedis.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { enedisJobToJobsPartners, ZEnedisJob } from "./enedis-mapper"

const rawCollectionName = rawEnedisModel.collectionName
const offerXmlTag = "offer"

export const importEnedisRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.ENEDIS,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const enedisFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.ENEDIS,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.enedisUrl),
}

export const importEnedisToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.ENEDIS,
    zodInput: ZEnedisJob,
    mapper: enedisJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
