import { importEdfRaw, importEdfToComputed } from "./import-edf"

export const processEdf = async () => {
  await importEdfRaw()
  await importEdfToComputed()
}
