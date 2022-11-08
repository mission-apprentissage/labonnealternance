import { emptyDir } from "fs-extra";
import path from "path";
import { connectToMongo } from "../../src/common/mongodb.js";
import config from "../../src/config.js";

import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const testDataDir = path.join(__dirname, "../../.local/test");
let mongoHolder = null;

const connectToMongoForTests = async () => {
  if (!mongoHolder) {
    const uri = config.mongodb.uri.split("labonnealternance").join("labonnealternance_test");
    mongoHolder = await connectToMongo(uri);
  }
  return mongoHolder;
};

import * as models from "../../src/common/model/index.js";

const cleanAll = () => {
  return Promise.all([emptyDir(testDataDir), ...Object.values(models).map((m) => m.deleteMany())]);
};

export { connectToMongoForTests, cleanAll };
