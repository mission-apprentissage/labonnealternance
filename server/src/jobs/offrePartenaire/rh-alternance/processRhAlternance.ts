import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./importRHAlternance"

export const processRhAlternance = async () => {
  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
}
