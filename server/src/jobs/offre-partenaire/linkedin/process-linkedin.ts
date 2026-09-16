import { getLinkedinJobs } from "@/common/apis/linkedin/linkedin.client"
import { importLinkedinRaw, importLinkedinToComputed } from "./import-linkedin"

export const processLinkedin = async () => {
  const sourceStream = await getLinkedinJobs()
  const raw = await importLinkedinRaw(sourceStream)
  const computed = await importLinkedinToComputed()
  return { raw, computed }
}
