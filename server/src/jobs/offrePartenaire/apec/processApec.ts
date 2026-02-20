import { importApecRaw, importApecToComputed } from "./importApec"
import { getFileFromApecFTP } from "@/common/apis/apec/apec.client"

export const processApec = async () => {
  const sourceStream = await getFileFromApecFTP()
  await importApecRaw(sourceStream)
  await importApecToComputed()
}
