import path from "path";
import { emptyDir } from "fs-extra";
import config from "../../src/config.js";
import { connectToMongo } from "../../src/common/mongodb.js";
import * as models from "../../src/common/model/index.js";

const testDataDir = path.join(__dirname, "../../.local/test");
let mongoHolder = null;

const connectToMongoForTestsFn = async () => {
  if (!mongoHolder) {
    const uri = config.mongodb.uri.split("doctrina").join("doctrina_test");
    mongoHolder = await connectToMongo(uri);
  }
  return mongoHolder;
};

export const connectToMongoForTests = mongoHolder || connectToMongoForTestsFn;
export const cleanAll = () => Promise.all([emptyDir(testDataDir), ...Object.values(models).map((m) => m.deleteMany())]);
