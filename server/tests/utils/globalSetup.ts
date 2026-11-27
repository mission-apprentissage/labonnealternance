import { existsSync } from "node:fs"
import { MongoClient } from "mongodb"
import { readEnvForTests } from "./loadEnvForTests"
import type { TestDbRegistryEntry } from "./test-database"
import { getTestDbNamespace, planTestDatabaseCleanup, replaceUriDatabase, TEST_DB_REGISTRY, TEST_DB_REGISTRY_COLLECTION, WORKTREE_ROOT } from "./test-database"

const withRegistry = async (uri: string | undefined, run: (client: MongoClient) => Promise<void>) => {
  const client = new MongoClient(replaceUriDatabase(uri ?? "", TEST_DB_REGISTRY), {
    connectTimeoutMS: 1_000,
    socketTimeoutMS: 1_000,
    serverSelectionTimeoutMS: 1_000,
  })
  try {
    await client.connect()
    await run(client)
  } catch (e) {
    console.error(e)
  } finally {
    await client.close()
  }
}

export default async () => {
  // Les workers de tous les projets héritent de l'environnement du processus principal : on ne le modifie pas.
  const env = readEnvForTests()
  const namespace = getTestDbNamespace(env)

  // Enregistré aussi sous VS Code, où le teardown n'a pas lieu : le registre permet de supprimer ces bases
  // quand le worktree disparaît.
  if (!process.env.CI) {
    await withRegistry(env.LBA_MONGODB_URI, async (client) => {
      await client
        .db()
        .collection<TestDbRegistryEntry>(TEST_DB_REGISTRY_COLLECTION)
        .updateOne({ _id: namespace }, { $set: { root: WORKTREE_ROOT, updatedAt: new Date() } }, { upsert: true })
    })
  }

  return async () => {
    if (process.env.CI || process.env.VITEST_VSCODE) {
      return
    }

    await withRegistry(env.LBA_MONGODB_URI, async (client) => {
      const registry = client.db().collection<TestDbRegistryEntry>(TEST_DB_REGISTRY_COLLECTION)
      const [{ databases }, entries] = await Promise.all([client.db().admin().listDatabases({ nameOnly: true }), registry.find().toArray()])
      const plan = planTestDatabaseCleanup({ databaseNames: databases.map(({ name }) => name), namespace, registry: entries, rootExists: existsSync })
      await Promise.all(plan.databases.map(async (name) => client.db(name).dropDatabase()))
      // Après les suppressions seulement : en cas d'échec, le prochain teardown retente.
      if (plan.staleNamespaces.length > 0) {
        await registry.deleteMany({ _id: { $in: plan.staleNamespaces } })
      }
    })
  }
}
