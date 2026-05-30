import { importEnedisRaw, importEnedisToComputed } from "./importEnedis"

export const processEnedis = async () => {
  await importEnedisRaw()
  await importEnedisToComputed()
}
