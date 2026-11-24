import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importJoobleRaw, importJoobleToComputed, joobleFlux } from "./import-jooble"

export const processJooble = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [joobleFlux],
    skipIfUnchanged,
    process: async ([stream]) => {
      await importJoobleRaw(stream)
      await importJoobleToComputed()
    },
  })
