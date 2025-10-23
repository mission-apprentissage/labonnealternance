import { importDecathlonRaw, importDecathlonToComputed } from "@/jobs/offrePartenaire/decathlon/importDecathlon"

export const processDecathlon = async () => {
  await importDecathlonRaw()
  await importDecathlonToComputed()
}
