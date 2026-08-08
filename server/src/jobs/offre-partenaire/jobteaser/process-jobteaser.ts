import { importJobteaserRaw, importJobteaserToComputed } from "./import-jobteaser"

export const processJobteaser = async () => {
  await importJobteaserRaw()
  await importJobteaserToComputed()
}
