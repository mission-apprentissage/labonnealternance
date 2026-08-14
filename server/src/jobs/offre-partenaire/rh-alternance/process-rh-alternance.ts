import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./import-rh-alternance"

export const processRhAlternance = async () => {
  const raw = await importRHAlternanceRaw()
  const computed = await importRHAlternanceToComputed()
  return { raw, computed }
}
