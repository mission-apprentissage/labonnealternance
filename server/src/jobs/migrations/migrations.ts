import { readFile, writeFile } from "node:fs/promises"
import path from "path"

import { config as mconfig, create as mcreate, status as mstatus, up as mup } from "migrate-mongo"

import { __dirname } from "@/common/utils/esmUtils"
import config from "@/config"

import { getMongodbClient } from "../../common/utils/mongodbUtils"

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

export async function up() {
  mconfig.set(myConfig)

  await status()

  const client = getMongodbClient()
  // @ts-ignore
  await mup(client.db(), client)
}

// Show migration status and returns number of pending migrations
export async function status(): Promise<number> {
  // @ts-ignore
  mconfig.set(myConfig)
  const client = getMongodbClient()

  // @ts-ignore
  const migrationStatus = await mstatus(client.db())
  migrationStatus.forEach(({ fileName, appliedAt }) => console.info(fileName, ":", appliedAt))

  return migrationStatus.filter(({ appliedAt }) => appliedAt === "PENDING").length
}

export async function create({ description }: { description: string }) {
  mconfig.set({
    ...myConfig,
    migrationsDir: "src/migrations",
    migrationFileExtension: ".ts",
  })
  const fileName = await mcreate(description)
  const file = `src/migrations/${fileName}`
  const content = await readFile(file, {
    encoding: "utf-8",
  })
  // ajoute le typage TS et supprime la migration down inutile
  const newContent = `import { getDbCollection } from "@/common/utils/mongodbUtils"

${content.replaceAll("async (db, client)", "async ()").replace(/\nexport const down =[\s\S]+/, "")}`

  await writeFile(file, newContent, { encoding: "utf-8" })
  console.info("Created:", fileName)
}
