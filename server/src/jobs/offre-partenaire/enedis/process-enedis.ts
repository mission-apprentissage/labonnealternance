import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { enedisFlux, importEnedisRaw, importEnedisToComputed } from "./import-enedis"

export const processEnedis = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [enedisFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importEnedisRaw(stream)
      const computed = await importEnedisToComputed()
      return { raw, computed }
    },
  })
