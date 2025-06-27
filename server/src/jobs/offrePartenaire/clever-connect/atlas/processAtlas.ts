import { importAtlasRaw, importAtlasToComputed } from "@/jobs/offrePartenaire/clever-connect/atlas/importAtlas"

export const processAtlas = async () => {
  await importAtlasRaw()
  await importAtlasToComputed()
}
