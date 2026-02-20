import { importApecRaw, importApecToComputed } from "./importApec"
import { getApecJobs } from "@/common/apis/apec/apec.client"

export const processApec = async () => {
  const sourceStream = await getApecJobs()
  await importApecRaw(sourceStream)
  await importApecToComputed()
}
