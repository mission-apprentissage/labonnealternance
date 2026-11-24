import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { getJobteaserFlux, importJobteaserRaw, importJobteaserToComputed } from "./import-jobteaser"

export const processJobteaser = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [getJobteaserFlux()],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importJobteaserRaw(stream)
      const computed = await importJobteaserToComputed()
      return { raw, computed }
    },
  })
