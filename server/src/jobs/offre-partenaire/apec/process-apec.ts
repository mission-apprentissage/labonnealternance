import { getApecJobs } from "@/common/apis/apec/apec.client"
import { importApecRaw, importApecToComputed } from "./import-apec"

export const processApec = async () => {
  const sourceStream = await getApecJobs()
  try {
    const raw = await importApecRaw(sourceStream)
    const computed = await importApecToComputed()
    return { raw, computed }
  } finally {
    // Libère le fichier temporaire créé par downloadFileFromSFTP même si l'import échoue avant
    // d'avoir consommé le stream.
    sourceStream.destroy()
  }
}
