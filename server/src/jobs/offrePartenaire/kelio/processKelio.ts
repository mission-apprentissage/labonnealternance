import { importKelioRaw, importKelioToComputed } from "./importKelio"

export const processKelio = async () => {
  await importKelioRaw()
  await importKelioToComputed()
}
