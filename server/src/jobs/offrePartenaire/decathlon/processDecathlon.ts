import { importDecathlonRaw, importDecathlonToComputed } from "./importDecathlon"

export const processDecathlon = async () => {
  await importDecathlonRaw()
  await importDecathlonToComputed()
}
