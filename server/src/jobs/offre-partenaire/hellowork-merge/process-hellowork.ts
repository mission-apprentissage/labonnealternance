import { helloWorkFlux, importHelloWorkRaw, importHelloWorkToComputed } from "@/jobs/offre-partenaire/hellowork/import-hello-work"
import { helloWorkBuddiFlux, importHelloWorkBuddiRaw, importHelloWorkBuddiToComputed } from "@/jobs/offre-partenaire/hellowork-buddi/import-hello-work-buddi"
import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { deduplicateHellowork } from "./deduplicate-hellowork"

// Les deux flux sont retraités ensemble : la déduplication supprime des offres de raw_hellowork
// selon le contenu de raw_hellowork_buddi.
export const processHellowork = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) =>
  importFluxIfChanged({
    fluxes: [helloWorkFlux, helloWorkBuddiFlux],
    skipIfUnchanged,
    process: async ([helloWorkStream, helloWorkBuddiStream]) => {
      const helloWorkRaw = await importHelloWorkRaw(helloWorkStream)
      const helloWorkBuddiRaw = await importHelloWorkBuddiRaw(helloWorkBuddiStream)

      await deduplicateHellowork()

      const helloWorkComputed = await importHelloWorkToComputed()
      const helloWorkBuddiComputed = await importHelloWorkBuddiToComputed()

      return { helloWorkRaw, helloWorkBuddiRaw, helloWorkComputed, helloWorkBuddiComputed }
    },
  })
