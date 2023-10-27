import { config } from "dotenv"
import { MongoClient } from "mongodb"

export default async () => {
  return async () => {
    config({ path: "./server/.env.test" })

    const client = new MongoClient(process.env.LBA_MONGODB_URI?.replace("VITEST_POOL_ID", "") ?? "")
    try {
      if (process.env.CI) {
        return
      }

      await client.connect()
      const dbs = await client.db().admin().listDatabases()
      await Promise.all(
        dbs.databases.map((db) => {
          if (db.name.startsWith("lba-test-")) {
            return client.db(db.name).dropDatabase()
          }

          return
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      await client.close()
    }
  }
}
