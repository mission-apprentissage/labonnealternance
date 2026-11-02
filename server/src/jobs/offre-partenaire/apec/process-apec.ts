import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawApecModel from "shared/models/raw-apec.model"
import { getApecJobs, getApecJobsStats } from "@/common/apis/apec/apec.client"
import { sftpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importApecRaw, importApecToComputed } from "./import-apec"

export const processApec = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [{ partnerLabel: JOBPARTNERS_LABEL.APEC, rawCollection: rawApecModel.collectionName, source: sftpFluxSource({ stat: getApecJobsStats, download: getApecJobs }) }],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importApecRaw(stream)
      const computed = await importApecToComputed()
      return { raw, computed }
    },
  })
