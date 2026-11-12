import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importLeboncoin, importLeboncoinToComputed, leboncoinFlux } from "./import-leboncoin"

export const processLeboncoin = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [leboncoinFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importLeboncoin(stream)
      const computed = await importLeboncoinToComputed()
      return { raw, computed }
    },
  })
