import { MongoClient } from "mongodb";
import { writeData } from "oleoduc";
import config from "../config.js";
import { getCollectionDescriptors } from "./collections/collections.js";
import { getLoggerWithContext } from "./logger.js";

const logger = getLoggerWithContext("db");

let clientHolder;
function ensureInitialization() {
  if (!clientHolder) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.");
  }
}

function sendLogsToMongodb() {
  logger.addStream({
    name: "mongodb",
    type: "raw",
    level: "info",
    stream: writeData((data) => dbCollection("logs").insertOne(data)),
  });
}

export async function connectToMongodb(uri = config.mongodb.uri) {
  let client = await new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  clientHolder = client;

  if (config.log.destinations.includes("mongodb")) {
    sendLogsToMongodb();
  }

  return client;
}

export function closeMongodbConnection() {
  ensureInitialization();
  return clientHolder.close();
}

export function getDatabase() {
  ensureInitialization();
  return clientHolder.db();
}

export function dbCollection(name) {
  ensureInitialization();
  return clientHolder.db().collection(name);
}

export async function createCollectionIfNeeded(name) {
  let db = getDatabase();
  let collections = await db.listCollections().toArray();

  if (!collections.find((c) => c.name === name)) {
    await db.createCollection(name).catch(() => {});
  }
}

export function clearCollection(name) {
  logger.warn(`Suppression des données de la collection ${name}...`);
  return dbCollection(name)
    .deleteMany({})
    .then((res) => res.deletedCount);
}

export async function configureIndexes(options = {}) {
  await ensureInitialization();
  await Promise.all(
    getCollectionDescriptors().map(async ({ name, indexes }) => {
      let shouldDropIndexes = options.dropIndexes || false;
      let dbCol = dbCollection(name);

      logger.debug(`Configuring indexes for collection ${name} (drop:${shouldDropIndexes})...`);
      if (shouldDropIndexes) {
        await dbCol.dropIndexes({ background: false });
      }

      if (!indexes) {
        return;
      }

      await Promise.all(
        indexes().map(([index, options]) => {
          return dbCol.createIndex(index, options);
        })
      );
    })
  );
}

export async function configureValidation() {
  await ensureInitialization();
  await Promise.all(
    getCollectionDescriptors().map(async ({ name, schema }) => {
      await createCollectionIfNeeded(name);

      if (!schema) {
        return;
      }

      logger.debug(`Configuring validation for collection ${name}...`);
      let db = getDatabase();
      await db.command({
        collMod: name,
        validationLevel: "strict",
        validationAction: "error",
        validator: {
          $jsonSchema: schema(),
        },
      });
    })
  );
}
