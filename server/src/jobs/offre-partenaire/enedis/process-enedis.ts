import { importEnedisRaw, importEnedisToComputed } from "./import-enedis"

export const processEnedis = async () => {
  const raw = await importEnedisRaw()
  const computed = await importEnedisToComputed()
  return { raw, computed }
}
