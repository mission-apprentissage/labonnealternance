import { importLaposteRaw, importLaposteToComputed } from "./import-laposte"

export const processLaposte = async () => {
  const raw = await importLaposteRaw()
  const computed = await importLaposteToComputed()
  return { raw, computed }
}
