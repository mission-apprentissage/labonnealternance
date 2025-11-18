import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

import seoVilleModel from "shared/models/seoVille.model"

import { getDbCollection } from "@/common/utils/mongodbUtils.js"
import { logger } from "@/common/logger"

export async function exportVilleData() {
  try {
    const villes = await getDbCollection(seoVilleModel.collectionName).find({}).toArray()

    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), "../ui/public/data/seo")
    mkdirSync(dataDir, { recursive: true })

    // Export all villes to a single file
    const allVillesPath = join(dataDir, "villes.json")
    writeFileSync(allVillesPath, JSON.stringify(villes, null, 2))

    // Export individual ville files for easier loading
    for (const ville of villes) {
      const villePath = join(dataDir, `${ville.slug}.json`)
      writeFileSync(villePath, JSON.stringify(ville, null, 2))
    }

    logger.info(`Exported ${villes.length} villes to ${dataDir}`)
  } catch (error) {
    logger.error("Error exporting ville data:", error)
    throw error
  }
}
