import fs from "node:fs"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"

export async function importFichesRncp() {
  const filepath = getStaticFilePath("referentiel/export_fiches_RNCP_V4_1_2026-01-21.xml")
  console.log({ filepath })
  const fileStream = fs.createReadStream(filepath)
  await importFromStreamInXml({
    stream: fileStream,
    // @ts-ignore
    destinationCollection: "fiches_rncp",
    importName: "importFichesRncp",
    offerXmlTag: "FICHE",
    conflictingOpeningTagWithoutAttributes: true,
  })
}
