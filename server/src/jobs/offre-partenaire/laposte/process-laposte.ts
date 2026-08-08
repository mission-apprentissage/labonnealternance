import { importLaposteRaw, importLaposteToComputed } from "./import-laposte"

export const processLaposte = async () => {
  await importLaposteRaw()
  await importLaposteToComputed()
}
