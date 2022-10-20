import "dotenv/config";
import { logger } from "./common/logger.js";
import { configureValidation, connectToMongodb } from "./common/mongodb.js";
import server from "./http/server.js";

process.on("unhandledRejection", (e) => logger.error(e, "An unexpected error occurred"));
process.on("uncaughtException", (e) => logger.error(e, "An unexpected error occurred"));

(async function () {
  await connectToMongodb();
  await configureValidation();

  const http = await server();
  http.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`));
})();
