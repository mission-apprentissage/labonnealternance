import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importPassRaw, importPassToComputed, passFlux } from "./import-pass"

export const processPass = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [passFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importPassRaw(stream)
      const computed = await importPassToComputed()
      return { raw, computed }
    },
  })
