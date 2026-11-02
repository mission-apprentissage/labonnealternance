import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawKelioModel from "shared/models/raw-kelio.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import type { FluxDefinition } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { kelioJobToJobsPartners, ZKelioJob } from "./kelio-mapper"

const rawCollectionName = rawKelioModel.collectionName
const offerXmlTag = "job"

export const importKelioRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.KELIO,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const kelioFlux: FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL.KELIO,
  rawCollection: rawCollectionName,
  source: httpFluxSource(config.kelioUrl),
}

export const importKelioToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.KELIO,
    zodInput: ZKelioJob,
    mapper: kelioJobToJobsPartners,
    documentJobRoot: offerXmlTag,
    rawFilterQuery: { "job.job_type": { $in: ["Alternating", "Professional Contract"] } },
  })
}
