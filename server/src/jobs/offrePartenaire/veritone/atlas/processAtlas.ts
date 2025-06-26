import { importAtlasRaw, importAtlasToComputed } from "@/jobs/offrePartenaire/veritone/atlas/importAtlas"

export const processAtlas = async () => {
  await importAtlasRaw()
  await importAtlasToComputed()
}
