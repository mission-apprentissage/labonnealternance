import { deduplicateHellowork } from "./deduplicateHellowork"
import { importHelloWorkBuddiRaw, importHelloWorkBuddiToComputed } from "@/jobs/offrePartenaire/hellowork-buddi/importHelloWorkBuddi"
import { importHelloWorkRaw, importHelloWorkToComputed } from "@/jobs/offrePartenaire/hellowork/importHelloWork"

export const processHellowork = async () => {
  await importHelloWorkRaw()
  await importHelloWorkBuddiRaw()

  await deduplicateHellowork()

  await importHelloWorkToComputed()
  await importHelloWorkBuddiToComputed()
}
