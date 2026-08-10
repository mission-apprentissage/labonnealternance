import { getApecJobs } from "@/common/apis/apec/apec.client"
import { importApecRaw, importApecToComputed } from "./import-apec"

export const processApec = async () => {
  const sourceStream = await getApecJobs()
  const raw = await importApecRaw(sourceStream)
  const computed = await importApecToComputed()
  return { raw, computed }
}
