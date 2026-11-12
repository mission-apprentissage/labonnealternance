import { modelDescriptors } from "shared/models/models"
import { afterAll, beforeAll, beforeEach } from "vitest"

import { clearAllCollections, closeMongodbConnection, configureDbSchemaValidation, connectToMongodb, createIndexes, getDatabase } from "@/common/utils/mongodb-utils"
import config from "@/config"

// Une base par pool (1..maxWorkers), réutilisée d'un fichier à l'autre plutôt que recréée :
// créer une base coûte ~400 tables WiredTiger, dont les pics dépassent hookTimeout en CI.
export const startAndConnectMongodb = async () => {
  await connectToMongodb(config.mongodb.uri.replace("VITEST_POOL_ID", `${process.env.VITEST_POOL_ID}`))
  await dropUndeclaredCollections()
  await Promise.all([createIndexes(), configureDbSchemaValidation(modelDescriptors)])
}

// clearAllCollections ne vide que les données : une collection hors modèles (job_processor.*, reliquat de
// migration) garderait d'un fichier à l'autre ses validateurs et ses index.
export const dropUndeclaredCollections = async () => {
  const declared = new Set<string>(modelDescriptors.map(({ collectionName }) => collectionName))
  const collections = await getDatabase().listCollections({}, { nameOnly: true }).toArray()
  await Promise.all(collections.filter(({ name }) => !declared.has(name) && !name.startsWith("system.")).map(async ({ name }) => getDatabase().dropCollection(name)))
}

export const stopMongodb = async () => {
  await closeMongodbConnection()
}

type MockData = () => Promise<void>

// beforeAll are ran in parallel, we need to wait for clearDb to be done before mocking data
export const useMongo = (mock: MockData | null = null, step: "beforeAll" | "beforeEach" = "beforeEach") => {
  beforeAll(async () => {
    await startAndConnectMongodb()
    if (step === "beforeAll") {
      await clearAllCollections()
      await mock?.()
    }
  })

  afterAll(async () => {
    await stopMongodb()
  })

  if (step === "beforeEach") {
    beforeEach(async () => {
      await clearAllCollections()
      await mock?.()
    })
  }
}
