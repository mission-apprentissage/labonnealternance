import { importJobteaserRaw, importJobteaserToComputed } from "./importJobteaser"

export const processJobteaser = async () => {
  await importJobteaserRaw()
  await importJobteaserToComputed()
}
