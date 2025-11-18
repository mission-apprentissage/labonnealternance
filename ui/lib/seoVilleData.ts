import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { ISeoVille } from "shared/models/seoVille.model"

/**
 * Load ville data from JSON file
 * This function is only called during build time (SSG) on the server
 */
export function loadVilleData(slug: string): ISeoVille | null {
  try {
    const filePath = join(process.cwd(), "public/data/seo", `${slug}.json`)
    const fileContent = readFileSync(filePath, "utf-8")
    return JSON.parse(fileContent) as ISeoVille
  } catch (error) {
    console.error(`Failed to load ville data for ${slug}:`, error)
    return null
  }
}

/**
 * Load all villes for generateStaticParams
 */
export function loadAllVilles(): ISeoVille[] {
  try {
    const filePath = join(process.cwd(), "public/data/seo", "villes.json")
    const fileContent = readFileSync(filePath, "utf-8")
    return JSON.parse(fileContent) as ISeoVille[]
  } catch (error) {
    console.error("Failed to load all villes data:", error)
    return []
  }
}
