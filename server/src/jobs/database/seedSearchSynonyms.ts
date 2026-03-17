import fs from "fs"
import { ObjectId } from "mongodb"
import path from "path"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const seedSearchSynonyms = async () => {
  const configPath = path.resolve(process.cwd(), "../docs/mongodb/search-synonyms.json")
  const synonymGroups = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Array<{ mappingType: "equivalent"; synonyms: string[] }>

  const docs = synonymGroups.map(({ synonyms }) => ({
    _id: new ObjectId(),
    mappingType: "equivalent" as const,
    synonyms: synonyms.map((s) => s.trim()).filter(Boolean),
  }))

  await getDbCollection("search_synonyms").deleteMany({})
  await getDbCollection("search_synonyms").insertMany(docs)
  logger.info(`${docs.length} synonymes importés dans search_synonyms`)
}
