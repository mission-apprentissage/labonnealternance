import { importHelloWorkRaw, importHelloWorkToComputed } from "@/jobs/offrePartenaire/hellowork/import-hello-work"
import { importHelloWorkBuddiRaw, importHelloWorkBuddiToComputed } from "@/jobs/offrePartenaire/hellowork-buddi/import-hello-work-buddi"
import { deduplicateHellowork } from "./deduplicate-hellowork"

export const processHellowork = async () => {
  await importHelloWorkRaw()
  await importHelloWorkBuddiRaw()

  await deduplicateHellowork()

  await importHelloWorkToComputed()
  await importHelloWorkBuddiToComputed()
}
