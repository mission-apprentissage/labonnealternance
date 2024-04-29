import { captureException } from "@sentry/node"
// import { Collection, CollectionInfo, MongoClient, MongoServerError } from "mongodb" // to uncomment when migrated to V6
import { Collection, MongoClient } from "mongodb"
import { CollectionName, IModelDescriptor } from "shared/models/common"
import { IDocumentMap, modelDescriptors } from "shared/models/models"
import { zodToMongoSchema } from "zod-mongodb-schema"

import { logger } from "../logger"

import { sleep } from "./asyncUtils"

let mongodbClient: MongoClient | null = null

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
  const client = new MongoClient(uri)

  client.on("connectionPoolReady", () => {
    logger.info("MongoDB reconnected")
    mongodbClient = client
  })

  client.on("connectionPoolClosed", () => {
    logger.warn("MongoDB closed")
    mongodbClient = null
  })

  await client.connect()
  mongodbClient = client
  logger.info("Connected to MongoDB")

  return client
}

export const getMongodbClient = () => mongodbClient

export const closeMongodbConnection = async () => {
  logger.warn("Closing MongoDB")
  // Let 100ms for possible callback cleanup to register tasks in mongodb queue
  await sleep(200)
  return mongodbClient?.close()
}

export const getDatabase = () => {
  return ensureInitialization().db()
}

export const getDbCollection = <K extends CollectionName>(name: K): Collection<IDocumentMap[K]> => {
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
const createCollectionIfDoesNotExist = async (collectionName: CollectionName) => {
  const db = getDatabase()
  const collectionsInDb = await db.listCollections().toArray()
  const collectionExistsInDb = collectionsInDb.map(({ name }) => name).includes(collectionName)

  if (!collectionExistsInDb) {
    try {
      await db.createCollection(collectionName)
    } catch (err) {
      /**
       * KBA : to uncomment when migrated to V7
       */
      // if ((err as MongoServerError).codeName !== "NamespaceExists") {
      //   throw err
      // }
    }
  }
}

/**
 * Vérification de l'existence d'une collection à partir de la liste des collections
 * @param {*} collectionsInDb
 * @param {*} collectionName
 * @returns
 */

/**
 * KBA : to uncomment when migrated to V7
 */
// export const collectionExistInDb = (collectionsInDb: CollectionInfo[], collectionName: string) => collectionsInDb.map(({ name }: { name: string }) => name).includes(collectionName)
export const collectionExistInDb = (collectionsInDb, collectionName: string) => collectionsInDb.map(({ name }: { name: string }) => name).includes(collectionName)

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
    logger.info(`Create indexes for collection ${descriptor.collectionName}`)
    await Promise.all(
      descriptor.indexes.map(async ([index, options]) => {
        try {
          await getDbCollection(descriptor.collectionName).createIndex(index, options)
        } catch (err) {
          captureException(err)
          logger.error(`Error creating indexes for ${descriptor.collectionName}: ${err}`)
        }
      })
    )
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
