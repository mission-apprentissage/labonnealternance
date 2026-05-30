import { importHelloWorkRaw, importHelloWorkToComputed } from "@/jobs/offrePartenaire/hellowork/importHelloWork"
import { importHelloWorkBuddiRaw, importHelloWorkBuddiToComputed } from "@/jobs/offrePartenaire/hellowork-buddi/importHelloWorkBuddi"
import { deduplicateHellowork } from "./deduplicateHellowork"

export const processHellowork = async () => {
  await importHelloWorkRaw()
  await importHelloWorkBuddiRaw()

  await deduplicateHellowork()

  await importHelloWorkToComputed()
  await importHelloWorkBuddiToComputed()
}
