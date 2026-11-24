import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawHelloWorkModel from "shared/models/raw-hello-work.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { helloWorkJobToJobsPartners, ZHelloWorkJob } from "./hello-work-mapper"

const rawCollectionName = rawHelloWorkModel.collectionName
const offerXmlTag = "job"

export const importHelloWorkRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.HELLOWORK,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const helloWorkFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.helloworkUrl),
}

export const importHelloWorkToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
    zodInput: ZHelloWorkJob,
    mapper: helloWorkJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
