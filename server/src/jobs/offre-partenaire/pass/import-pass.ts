import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawPassModel from "shared/models/raw-pass.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { passJobToJobsPartners, ZPassJob } from "./pass-mapper"

const rawCollectionName = rawPassModel.collectionName
const offerXmlTag = "item"

export const importPassRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, importName: JOBPARTNERS_LABEL.PASS })
}

export const passFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.PASS,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.passUrl),
}

export const importPassToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.PASS,
    zodInput: ZPassJob,
    mapper: passJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
