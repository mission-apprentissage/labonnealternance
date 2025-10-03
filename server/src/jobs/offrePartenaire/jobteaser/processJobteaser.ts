import { importJobteaserRaw, importJobteaserToComputed } from "./importJobteaser"

export const processJobTeaser = async () => {
  await importJobteaserRaw()
  await importJobteaserToComputed()
}
