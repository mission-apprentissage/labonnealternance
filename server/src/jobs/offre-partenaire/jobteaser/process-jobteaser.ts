import { importJobteaserRaw, importJobteaserToComputed } from "./import-jobteaser"

export const processJobteaser = async () => {
  const raw = await importJobteaserRaw()
  const computed = await importJobteaserToComputed()
  return { raw, computed }
}
