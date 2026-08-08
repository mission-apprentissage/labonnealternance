import fs from "node:fs"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/import-from-stream-in-xml"

export async function importFichesRncp() {
  const filepath = getStaticFilePath("referentiel/export_fiches_RNCP_V4_1_2026-01-21.xml")
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
