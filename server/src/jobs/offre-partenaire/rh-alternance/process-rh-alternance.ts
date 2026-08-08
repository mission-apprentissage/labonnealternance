import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./import-rh-alternance"

export const processRhAlternance = async () => {
  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
}
