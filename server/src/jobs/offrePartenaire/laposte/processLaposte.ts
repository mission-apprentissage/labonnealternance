import { importLaposteRaw, importLaposteToComputed } from "./importLaposte"

export const processLaposte = async () => {
  await importLaposteRaw()
  await importLaposteToComputed()
}
