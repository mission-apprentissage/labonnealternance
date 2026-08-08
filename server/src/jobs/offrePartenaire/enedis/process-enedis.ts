import { importEnedisRaw, importEnedisToComputed } from "./import-enedis"

export const processEnedis = async () => {
  await importEnedisRaw()
  await importEnedisToComputed()
}
