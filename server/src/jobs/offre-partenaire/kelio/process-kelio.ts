import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importKelioRaw, importKelioToComputed, kelioFlux } from "./import-kelio"

export const processKelio = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [kelioFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importKelioRaw(stream)
      const computed = await importKelioToComputed()
      return { raw, computed }
    },
  })
