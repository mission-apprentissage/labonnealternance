import { importPassRaw, importPassToComputed } from "./importPass"

export const processPass = async () => {
  await importPassRaw()
  await importPassToComputed()
}
