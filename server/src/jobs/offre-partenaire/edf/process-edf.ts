import { importEdfRaw, importEdfToComputed } from "./import-edf"

export const processEdf = async () => {
  const raw = await importEdfRaw()
  const computed = await importEdfToComputed()
  return { raw, computed }
}
