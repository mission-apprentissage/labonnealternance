import { readFileSync } from "fs"
import type { AnyBulkWriteOperation } from "mongodb"
import { ObjectId } from "mongodb"
import path from "path"
import type { ISearchItemKeywords } from "shared/models/search-items-keywords.model"
import { gunzipSync } from "zlib"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Pré-remplit le cache `search_items_keywords` avec les mots-clés Mistral déjà générés
 * lors de la recette (batchs de juillet 2026, ~383k réponses → 32 629 hashs uniques).
 * Le cache est keyé par sha256 du texte source : les entrées sont valables dans tous les
 * environnements — la première génération en recette/production ne paiera que le delta.
 *
 * Fichier embarqué dans l'image server (cf. Dockerfile), format JSONL gzippé minimal :
 * {"h": "<source_hash>", "k": ["mot-clé", ...]} par ligne.
 */
export const up = async () => {
  const filePath = path.resolve(process.cwd(), "../docs/mongodb/search-items-keywords-cache.jsonl.gz")
  const lines = gunzipSync(readFileSync(filePath)).toString("utf8").split("\n")

  const now = new Date()
  const collection = getDbCollection("search_items_keywords")
  let ops: AnyBulkWriteOperation<ISearchItemKeywords>[] = []
  let upserted = 0

  for (const line of lines) {
    if (!line.trim()) continue
    const { h, k } = JSON.parse(line) as { h: string; k: string[] }
    ops.push({
      updateOne: {
        filter: { source_hash: h },
        // $setOnInsert uniquement : ne jamais écraser une entrée déjà (re)générée sur place.
        update: {
          $setOnInsert: { _id: new ObjectId(), source_hash: h, keywords: k, model: "mistral-small-latest", origin: "manual_import", created_at: now, last_used_at: now },
        },
        upsert: true,
      },
    })
    if (ops.length >= 1000) {
      const result = await collection.bulkWrite(ops, { ordered: false })
      upserted += result.upsertedCount
      ops = []
    }
  }
  if (ops.length) {
    const result = await collection.bulkWrite(ops, { ordered: false })
    upserted += result.upsertedCount
  }

  logger.info(`seed-search-items-keywords-cache: ${upserted} entrées insérées dans le cache`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
