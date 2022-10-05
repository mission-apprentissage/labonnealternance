import "dotenv/config";
import server from "./http/server.js";
import { logger } from "./common/logger.js";
import { connectToMongodb, configureValidation } from "./common/mongodb.js";

process.on("unhandledRejection", (e) => logger.error(e, "An unexpected error occurred"));
process.on("uncaughtException", (e) => logger.error(e, "An unexpected error occurred"));

(async function () {
  await connectToMongodb();
  await configureValidation();

  const http = await server();
  http.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`));
})();
