import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEdfModel from "shared/models/raw-edf.model"
import config from "@/config"
import { ZEnedisJob } from "@/jobs/offre-partenaire/enedis/enedis-mapper"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { edfJobToJobsPartners } from "./edf-mapper"

const rawCollectionName = rawEdfModel.collectionName
const offerXmlTag = "offer"

export const importEdfRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.EDF,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const edfFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.EDF,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.edfUrl),
}

export const importEdfToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.EDF,
    zodInput: ZEnedisJob, // same structure as Enedis, so we can reuse the same Zod schema
    mapper: edfJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
