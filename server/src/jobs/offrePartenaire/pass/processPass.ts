import { importPassRaw, importPassToComputed } from "@/jobs/offrePartenaire/pass/importPass"

export const processPass = async () => {
  await importPassRaw()
  await importPassToComputed()
}
