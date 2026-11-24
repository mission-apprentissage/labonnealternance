import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawDecathlonModel from "shared/models/raw-decathlon.model"
import z from "zod"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInJson } from "@/jobs/offre-partenaire/import-from-stream-in-json"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { decathlonJobToJobsPartners, ZDecathlonJob } from "./decathlon-mapper"

const rawCollectionName = rawDecathlonModel.collectionName

const ZJsonFile = z.looseObject({
  ads: z.array(ZDecathlonJob),
})

export const importDecathlonRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInJson({
    destinationCollection: rawCollectionName,
    stream: sourceStream,
    partnerLabel: JOBPARTNERS_LABEL.DECATHLON,
    getOffers(json) {
      const parsed = ZJsonFile.parse(json)
      return parsed.ads
    },
  })
}

export const importDecathlonToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.DECATHLON,
    zodInput: ZDecathlonJob,
    mapper: decathlonJobToJobsPartners,
  })
}

export const processDecathlon = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [{ partnerLabel: JOBPARTNERS_LABEL.DECATHLON, rawCollection: rawCollectionName, source: httpFluxSource(config.decathlonUrl) }],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importDecathlonRaw(stream)
      const computed = await importDecathlonToComputed()
      return { raw, computed }
    },
  })
