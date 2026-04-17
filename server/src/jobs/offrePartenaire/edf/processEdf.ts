import { importEdfRaw, importEdfToComputed } from "./importEDF"

export const processEdf = async () => {
  await importEdfRaw()
  await importEdfToComputed()
}
