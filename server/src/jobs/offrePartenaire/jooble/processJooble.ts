import { importJoobleRaw, importJoobleToComputed } from "./importJooble"

export const processJooble = async () => {
  await importJoobleRaw()
  await importJoobleToComputed()
}
