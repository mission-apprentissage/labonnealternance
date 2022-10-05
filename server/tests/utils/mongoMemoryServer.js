import { MongoMemoryServer } from "mongodb-memory-server"; // eslint-disable-line node/no-unpublished-import
import { connectToMongodb, getDatabase, configureValidation, configureIndexes } from "../../src/common/mongodb.js";

let mongodHolder;

export async function startMongod() {
  mongodHolder = await MongoMemoryServer.create({
    binary: {
      version: "5.0.2",
    },
  });
  let uri = mongodHolder.getUri();
  let client = await connectToMongodb(uri);
  await configureIndexes();
  await configureValidation();
  return client;
}

export function stopMongod() {
  return mongodHolder.stop();
}

export async function removeAll() {
  let collections = await getDatabase().collections();
  return Promise.all(collections.map((c) => c.deleteMany({})));
}
