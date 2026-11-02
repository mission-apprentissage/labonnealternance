import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawJoobleModel from "shared/models/raw-jooble.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { joobleJobToJobsPartners, ZJoobleJob } from "./jooble-mapper"

const rawCollectionName = rawJoobleModel.collectionName
const offerXmlTag = "job"

export const importJoobleRaw = async (sourceStream: NodeJS.ReadableStream) => {
  await importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.JOOBLE,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const joobleFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.JOOBLE,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.joobleUrl),
}

export const importJoobleToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.JOOBLE,
    zodInput: ZJoobleJob,
    mapper: joobleJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
