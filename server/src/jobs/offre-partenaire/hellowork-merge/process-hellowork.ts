import { importHelloWorkRaw, importHelloWorkToComputed } from "@/jobs/offre-partenaire/hellowork/import-hello-work"
import { importHelloWorkBuddiRaw, importHelloWorkBuddiToComputed } from "@/jobs/offre-partenaire/hellowork-buddi/import-hello-work-buddi"
import { deduplicateHellowork } from "./deduplicate-hellowork"

export const processHellowork = async () => {
  const helloWorkRaw = await importHelloWorkRaw()
  const helloWorkBuddiRaw = await importHelloWorkBuddiRaw()

  await deduplicateHellowork()

  const helloWorkComputed = await importHelloWorkToComputed()
  const helloWorkBuddiComputed = await importHelloWorkBuddiToComputed()

  return { helloWorkRaw, helloWorkBuddiRaw, helloWorkComputed, helloWorkBuddiComputed }
}
