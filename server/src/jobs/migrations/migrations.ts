import { readdir, writeFile } from "node:fs/promises"
import path from "path"

import { internal } from "@hapi/boom"
import { format } from "date-fns"

import { __dirname } from "@/common/utils/esmUtils"
import config from "@/config"

import { withCause } from "../../common/utils/errorManager"
import { getDatabase, getMongodbClient } from "../../common/utils/mongodbUtils"

const myConfig = {
  mongodb: {
    url: config.mongodb.uri,

    // in URL
    databaseName: "",

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: path.join(__dirname(import.meta.url), "./migrations"),

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: "esm",
}

async function listMigrationFiles(): Promise<string[]> {
  const files = await readdir(myConfig.migrationsDir, { withFileTypes: true })

  return files.filter((file) => file.isFile() && file.name.endsWith(myConfig.migrationFileExtension)).map((file) => file.name)
}

async function getAppliedMigrations(): Promise<Map<string, Date>> {
  const db = getDatabase()
  const appliedMigrations = await db
    .collection("changelog")
    .find({}, { sort: { fileName: 1 } })
    .toArray()

  return new Map(appliedMigrations.map(({ fileName, appliedAt }) => [fileName, appliedAt]))
}

export async function up(): Promise<number> {
  const migrationFiles = await listMigrationFiles()
  const appliedMigrationsFiles = await getAppliedMigrations()

  let count = 0
  for (const migrationFile of migrationFiles) {
    if (!appliedMigrationsFiles.has(migrationFile)) {
      count++
      try {
        const { up } = await import(path.join(myConfig.migrationsDir, migrationFile))
        await up(getDatabase(), getMongodbClient())
        await getDatabase().collection(myConfig.changelogCollectionName).insertOne({ fileName: migrationFile, appliedAt: new Date() })
        console.log(`${migrationFile} : APPLIED`)
      } catch (e) {
        throw withCause(internal("Error applying migration", { migrationFile }), e as Error)
      }
    }
  }

  return count
}

// Show migration status and returns number of pending migrations
export async function status(): Promise<{ count: number; requireShutdown: boolean }> {
  const migrationFiles = await listMigrationFiles()
  const appliedMigrationsFiles = await getAppliedMigrations()

  const result = {
    requireShutdown: false,
    count: 0,
  }

  for (const migrationFile of migrationFiles) {
    if (!appliedMigrationsFiles.has(migrationFile)) {
      result.count++
    }
    const { requireShutdown = false } = await import(path.join(myConfig.migrationsDir, migrationFile))
    result.requireShutdown = result.requireShutdown || requireShutdown

    const appliedAt = appliedMigrationsFiles.get(migrationFile) ?? "PENDING"
    console.log(`${migrationFile} : ${appliedAt}`)
  }

  return result
}

export async function create({ description }: { description: string }) {
  const fileName = `${format(new Date(), "yyyyMMddHHmmss")}-${description.replaceAll(" ", "_")}.ts`
  const file = `src/migrations/${fileName}`
  const newContent = `
import { getDbCollection } from "@/common/utils/mongodbUtils";

export const up = async () => {
await getDbCollection("").updateMany({}, { $set: { "profile.newField": "defaultValue" } });
};

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true;`

  await writeFile(file, newContent, { encoding: "utf-8" })
  console.log("Created:", fileName)
}
