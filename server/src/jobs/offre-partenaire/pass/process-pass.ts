import { importPassRaw, importPassToComputed } from "./import-pass"

export const processPass = async () => {
  await importPassRaw()
  await importPassToComputed()
}
