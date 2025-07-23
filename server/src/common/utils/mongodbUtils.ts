import { captureException } from "@sentry/node"
import { isEqual } from "lodash-es"
import { ChangeStream, Collection, CollectionInfo, Db, IndexDescriptionInfo, MongoClient, MongoServerError } from "mongodb"
import { assertUnreachable } from "shared"
import { IModelDescriptor } from "shared/models/common"
import { CollectionName, IDocument, modelDescriptors } from "shared/models/models"
import { IResumeToken, IResumeTokenData } from "shared/models/resumeTokens.model"
import { zodToMongoSchema } from "zod-mongodb-schema"

import { updateJobsPartnersFromRecruiterDelete, updateJobsPartnersFromRecruiterUpdate } from "@/services/formulaire.service"
import { getResumeToken, storeResumeToken } from "@/services/resumeToken.service"

import config from "../../config"
import { logger } from "../logger"

import { sleep } from "./asyncUtils"

let mongodbClient: MongoClient | null = null
let mongodbClientState: string | null = null

let changeRecruiterStream: ChangeStream | null = null
let changeAnonymizedRecruiterStream: ChangeStream | null = null

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
    serverSelectionTimeoutMS: config.env === "local" ? 1_000 : 10_000,
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
  if (changeRecruiterStream) {
    await changeRecruiterStream.close()
  }
  if (changeAnonymizedRecruiterStream) {
    await changeAnonymizedRecruiterStream.close()
  }
  return mongodbClient?.close()
}

export const getDatabase = (): Db => {
  return ensureInitialization().db()
}

export const getDbCollection = <K extends CollectionName>(name: K): Collection<IDocument<K>> => {
  return ensureInitialization().db().collection(name)
}

export const getCollectionList = (): Promise<(CollectionInfo | Pick<CollectionInfo, "name" | "type">)[]> => {
  return ensureInitialization().db().listCollections().toArray()
}

export const getDbCollectionIndexes = async (name: CollectionName): Promise<IndexDescriptionInfo[]> => {
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
    modelDescriptors.map(async ({ collectionName, zod, authorizeAdditionalProperties = false }) => {
      await createCollectionIfDoesNotExist(collectionName)

      const convertedSchema = zodToMongoSchema(zod)

      try {
        await db.command({
          collMod: collectionName,
          validationLevel: "strict",
          validationAction: config.env === "production" ? "warn" : "error",
          validator: {
            $jsonSchema: {
              title: `${collectionName} validation schema`,
              ...convertedSchema,
              additionalProperties: authorizeAdditionalProperties,
            },
          },
        })

        logger.info(`Validation rule for collection ${collectionName} updated`)
      } catch (error) {
        logger.error(`Error adding validation rule for collection ${collectionName}`)
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

//TODO: extraire une partie du code dans un service pour éviter d'avoir du code trop spécifique dans mongodbUtils.ts
const startChangeStream = (collectionName: "recruiters" | "anonymized_recruiters", resumeToken: IResumeToken | null) => {
  logger.info(`Starting change stream for ${collectionName} with resumeToken:`, resumeToken)
  const collection = getDbCollection(collectionName)
  const changeStream = collection.watch([], resumeToken ? { resumeAfter: resumeToken.resumeTokenData } : {})

  if (collectionName === "recruiters") {
    changeStream
      .on("change", async (change) => {
        switch (change.operationType) {
          case "insert":
          case "update":
            await updateJobsPartnersFromRecruiterUpdate(change)
            await storeResumeToken("recruiters", change._id as IResumeTokenData)
            break
          case "delete":
            // n'arrivera pas car les formulaires ne sont pas supprimés, mais archivés
            break
          default:
            assertUnreachable(`Unexpected change operation type ${change.operationType}` as never)
        }
      })
      .once("error", (error) => {
        logger.error(`Error in change stream for ${collectionName}:`, error)
        changeStream.close()
        startChangeStream(collectionName, null)
      })
  } else if (collectionName === "anonymized_recruiters") {
    changeStream
      .on("change", async (change) => {
        if (change.operationType === "insert") {
          await updateJobsPartnersFromRecruiterDelete(change.documentKey._id)
          await storeResumeToken("anonymized_recruiters", change._id as IResumeTokenData)
        }
      })
      .once("error", (error) => {
        logger.error(`Error in change stream for ${collectionName}:`, error)
        changeStream.close()
        startChangeStream(collectionName, null)
      })
  }

  return changeStream
}

export const startRecruiterChangeStream = async () => {
  logger.info("Starting recruiter change stream")

  const resumeRecruiterToken = await getResumeToken("recruiters")
  changeRecruiterStream = startChangeStream("recruiters", resumeRecruiterToken)

  const resumeAnonymizedRecruiterToken = await getResumeToken("anonymized_recruiters")
  changeAnonymizedRecruiterStream = startChangeStream("anonymized_recruiters", resumeAnonymizedRecruiterToken)

  return {
    changeRecruiterStream,
    changeAnonymizedRecruiterStream,
  }
}
