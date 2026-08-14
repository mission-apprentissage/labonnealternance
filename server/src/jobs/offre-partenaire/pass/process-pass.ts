import { importPassRaw, importPassToComputed } from "./import-pass"

export const processPass = async () => {
  const raw = await importPassRaw()
  const computed = await importPassToComputed()
  return { raw, computed }
}
