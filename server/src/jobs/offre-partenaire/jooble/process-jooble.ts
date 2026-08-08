import { importJoobleRaw, importJoobleToComputed } from "./import-jooble"

export const processJooble = async () => {
  await importJoobleRaw()
  await importJoobleToComputed()
}
