import { importHelloWorkRaw, importHelloWorkToComputed } from "./importHelloWork"

export const processHellowork = async () => {
  await importHelloWorkRaw()
  await importHelloWorkToComputed()
}
