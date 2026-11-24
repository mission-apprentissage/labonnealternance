import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLaposteModel from "shared/models/raw-laposte.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { laposteJobToJobsPartners, ZLaposteJob } from "./laposte-mapper"

const rawCollectionName = rawLaposteModel.collectionName
const offerXmlTag = "offre"

export const importLaposteRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.LAPOSTE,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const laposteFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.laposteUrl),
}

export const importLaposteToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LAPOSTE,
    zodInput: ZLaposteJob,
    mapper: laposteJobToJobsPartners,
    documentJobRoot: offerXmlTag,
    rawFilterQuery: { "offre.type-de-contrat": "Alternance" },
  })
}
