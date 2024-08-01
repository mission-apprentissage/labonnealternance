import { captureException } from "@sentry/node"
import { isEqual } from "lodash-es"
import { Collection, CollectionInfo, MongoClient, MongoServerError } from "mongodb" // to uncomment when migrated to V7
import { IModelDescriptor } from "shared/models/common"
import { CollectionName, IDocument, modelDescriptors } from "shared/models/models"
import { zodToMongoSchema } from "zod-mongodb-schema"

import config from "../../config"
import { logger } from "../logger"

import { sleep } from "./asyncUtils"

let mongodbClient: MongoClient | null = null
let mongodbClientState: string | null = null

export const ensureInitialization = () => {
  if (!mongodbClient) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.")
  }
  return mongodbClient
}

/**
 * @param  {string} uri
 * @returns client
 */
export const connectToMongodb = async (uri: string) => {
  const client = new MongoClient(uri, {
    heartbeatFrequencyMS: 10_000,
    retryWrites: true,
    retryReads: true,
    minPoolSize: config.env === "local" ? 0 : 5,
    maxPoolSize: 1_000,
  })

  client.on("connectionPoolReady", () => {
    logger.info("MongoDB reconnected")
    mongodbClient = client
  })

  client.on("connectionPoolClosed", () => {
    logger.warn("MongoDB closed")
    mongodbClient = null
  })

  await client.connect()
  // @ts-expect-error
  mongodbClientState = client.topology.s.state
  mongodbClient = client
  logger.info("Connected to MongoDB")

  return client
}

export const getMongodbClient = () => mongodbClient
export const getMongodbClientState = () => mongodbClientState

export const closeMongodbConnection = async () => {
  logger.warn("Closing MongoDB")
  // Let 100ms for possible callback cleanup to register tasks in mongodb queue
  await sleep(200)
  return mongodbClient?.close()
}

export const getDatabase = () => {
  return ensureInitialization().db()
}

export const getDbCollection = <K extends CollectionName>(name: K): Collection<IDocument<K>> => {
  return ensureInitialization().db().collection(name)
}

export const getCollectionList = () => {
  return ensureInitialization().db().listCollections().toArray()
}

export const getDbCollectionIndexes = async (name: CollectionName) => {
  return await ensureInitialization().db().collection(name).indexes()
}

/**
 * Création d'une collection si elle n'existe pas
 * @param {string} collectionName
 */
const createCollectionIfDoesNotExist = async (collectionName: string) => {
  const db = getDatabase()
  const collectionsInDb = await db.listCollections().toArray()
  const collectionExistsInDb = collectionsInDb.map(({ name }) => name).includes(collectionName)

  if (!collectionExistsInDb) {
    try {
      await db.createCollection(collectionName)
    } catch (err) {
      if ((err as MongoServerError).codeName !== "NamespaceExists") {
        throw err
      }
    }
  }
}

/**
 * Vérification de l'existence d'une collection à partir de la liste des collections
 * @param {*} collectionsInDb
 * @param {*} collectionName
 * @returns
 */
export const collectionExistInDb = (collectionsInDb: CollectionInfo[], collectionName: string) => collectionsInDb.map(({ name }: { name: string }) => name).includes(collectionName)

/**
 * Config de la validation
 * @param {*} modelDescriptors
 */
export const configureDbSchemaValidation = async (modelDescriptors: IModelDescriptor[]) => {
  const db = getDatabase()
  ensureInitialization()
  await Promise.all(
    modelDescriptors.map(async ({ collectionName, zod }) => {
      await createCollectionIfDoesNotExist(collectionName)

      const convertedSchema = zodToMongoSchema(zod)

      try {
        await db.command({
          collMod: collectionName,
          validationLevel: "strict",
          validationAction: "error",
          validator: {
            $jsonSchema: {
              title: `${collectionName} validation schema`,
              ...convertedSchema,
            },
          },
        })
      } catch (error) {
        captureException(error)
        logger.error(error)
      }
    })
  )
}

/**
 * Clear de toutes les collections
 * @returns
 */
export const clearAllCollections = async () => {
  const collections = await getDatabase().collections()
  return Promise.all(collections.map((c) => c.deleteMany({})))
}

/**
 * Clear d'une collection
 * @param {string} name
 * @returns
 */
export async function clearCollection(name: string) {
  ensureInitialization()
  await getDatabase().collection(name).deleteMany({})
}

export const createIndexes = async () => {
  for (const descriptor of modelDescriptors) {
    if (!descriptor.indexes) {
      return
    }
    const indexes = await getDbCollection(descriptor.collectionName)
      .listIndexes()
      .toArray()
      .catch((err) => {
        // NamespaceNotFound
        if (err.code === 26) {
          return []
        }
        throw err
      })
    const indexesToRemove = new Set(indexes.filter((i) => i.name !== "_id_"))

    logger.info(`Create indexes for collection ${descriptor.collectionName}`)
    await Promise.all(
      descriptor.indexes.map(async ([index, options]): Promise<void> => {
        try {
          const existingIndex =
            // Use Object.entries because order matters
            indexes.find((i) => isEqual(Object.entries(i.key), Object.entries(index)) || options.name === i.name) ?? null

          if (existingIndex) {
            indexesToRemove.delete(existingIndex)
          }

          await getDbCollection(descriptor.collectionName)
            .createIndex(index, options)
            .catch(async (err) => {
              // IndexOptionsConflict & IndexKeySpecsConflict
              if (err.code === 85 || err.code === 86) {
                await getDbCollection(descriptor.collectionName).dropIndex(existingIndex.name)
                await getDbCollection(descriptor.collectionName).createIndex(index, options)
              } else {
                throw err
              }
            })
        } catch (err) {
          captureException(err)
          logger.error(`Error creating indexes for ${descriptor.collectionName}: ${err}`)
        }
      })
    )

    if (indexesToRemove.size > 0) {
      logger.warn(`Dropping extra indexes for collection ${descriptor.collectionName}`, indexesToRemove)
      await Promise.all(Array.from(indexesToRemove).map((index) => getDbCollection(descriptor.collectionName).dropIndex(index.name)))
    }
  }
}

export const dropIndexes = async () => {
  const collections = (await getCollectionList()).map((collection) => collection.name)
  for (const descriptor of modelDescriptors) {
    logger.info(`Drop indexes for collection ${descriptor.collectionName}`)
    if (collections.includes(descriptor.collectionName)) {
      await getDbCollection(descriptor.collectionName).dropIndexes()
    }
  }
}
