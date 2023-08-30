// @ts-nocheck
import { runScript } from "../../scriptWrapper.js"
import * as xml2j from "xml2js"
import { readFileSync } from "fs"
import iconv from "iconv-lite"
import __dirname from "../../../common/dirname.js"

runScript(async () => {
  const parser = new xml2j.Parser()

  const filePath = `${__dirname(import.meta.url)}/unix_fiche_emploi_metier_v450_iso8859-15.xml`

  const xmlBuffer = readFileSync(filePath)
  const xml = iconv.decode(xmlBuffer, "iso8859-15")

  const data = await parser.parseStringPromise(xml)
})
