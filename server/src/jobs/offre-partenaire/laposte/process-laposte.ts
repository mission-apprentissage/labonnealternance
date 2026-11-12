import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importLaposteRaw, importLaposteToComputed, laposteFlux } from "./import-laposte"

export const processLaposte = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [laposteFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importLaposteRaw(stream)
      const computed = await importLaposteToComputed()
      return { raw, computed }
    },
  })
