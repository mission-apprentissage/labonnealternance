import { importAtlasRaw, importAtlasToComputed } from "@/jobs/offrePartenaire/atlas/importAtlas"

export const processAtlas = async () => {
  await importAtlasRaw()
  await importAtlasToComputed()
}
