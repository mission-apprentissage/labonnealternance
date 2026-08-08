import { getApecJobs } from "@/common/apis/apec/apec.client"
import { importApecRaw, importApecToComputed } from "./import-apec"

export const processApec = async () => {
  const sourceStream = await getApecJobs()
  await importApecRaw(sourceStream)
  await importApecToComputed()
}
