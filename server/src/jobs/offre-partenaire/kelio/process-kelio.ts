import { importKelioRaw, importKelioToComputed } from "./import-kelio"

export const processKelio = async () => {
  const raw = await importKelioRaw()
  const computed = await importKelioToComputed()
  return { raw, computed }
}
