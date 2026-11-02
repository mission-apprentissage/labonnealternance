import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import rawHelloWorkBuddiModel from "shared/models/raw-hello-work-buddi.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { helloWorkBuddiJobToJobsPartners, ZHelloWorkBuddiJob } from "./hello-work-buddi-mapper"

const rawCollectionName = rawHelloWorkBuddiModel.collectionName
const offerXmlTag = "job"

export const importHelloWorkBuddiRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const helloWorkBuddiFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.helloworkBuddiUrl),
}

export const importHelloWorkBuddiToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK_BUDDI,
    zodInput: ZHelloWorkBuddiJob,
    mapper: helloWorkBuddiJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
