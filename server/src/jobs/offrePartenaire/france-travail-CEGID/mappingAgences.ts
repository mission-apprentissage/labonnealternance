import fs from "node:fs/promises"
import path from "node:path"
import z from "zod"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { __dirname } from "@/common/utils/dirname"

const ZAgenceCEGID = z.object({
  ClientCode: z.string(),
  OrderNumber: z.string(),
  Label: z.string(),
  Enabled: z.string(),
  Region: z.string(),
  GoogleRef: z.string(),
  DefaultLCID: z.string(),
  Ville: z.string(),
})

export type IAgenceCEGID = z.output<typeof ZAgenceCEGID>

export async function parseAgences() {
  const filepath = path.join(__dirname(import.meta.url), "./Flux FT Alternance_Table de transcodage des villes.xlsx - Table de transcodage des villes.csv")

  const content = (await fs.readFile(filepath)).toString()
  const parsedContent = await parseCsvContent(content)
  const agences = parsedContent.map((line) => ZAgenceCEGID.parse(line))
  return agences
}

export const regionsToAgence: Record<string, string> = {
  // id region => id agence
  _TS_CO_Region_ProvenceCotedAzur: "_TS_CO_etab_34362",
  _TS_CO_Region_DirectionGenerale: "_TS_CO_etab_75227",
  _TS_CO_Region_IledeFrance: "_TS_CO_etab_75227",
}
