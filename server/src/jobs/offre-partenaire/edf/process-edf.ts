import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { edfFlux, importEdfRaw, importEdfToComputed } from "./import-edf"

export const processEdf = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [edfFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importEdfRaw(stream)
      const computed = await importEdfToComputed()
      return { raw, computed }
    },
  })
