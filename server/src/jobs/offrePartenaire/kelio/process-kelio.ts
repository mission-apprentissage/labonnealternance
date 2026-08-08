import { importKelioRaw, importKelioToComputed } from "./import-kelio"

export const processKelio = async () => {
  await importKelioRaw()
  await importKelioToComputed()
}
