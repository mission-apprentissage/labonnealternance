import express from "express";
import bodyParser from "body-parser";
import config from "../config.js";
import { logger } from "../common/logger.js";
import { logMiddleware } from "./middlewares/logMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { tryCatch } from "./middlewares/tryCatchMiddleware.js";
import hello from "./routes/helloRoutes.js";
import { dbCollection } from "../common/mongodb.js";
import { packageJson } from "../common/esm.js";

export default async () => {
  const app = express();

  app.use(bodyParser.json());
  app.use(logMiddleware());
  app.use(hello());

  app.get(
    "/api",
    tryCatch(async (req, res) => {
      let mongodbStatus;

      await dbCollection("logs")
        .stats()
        .then(() => {
          mongodbStatus = true;
        })
        .catch((e) => {
          mongodbStatus = false;
          logger.error("Healthcheck failed", e);
        });

      return res.json({
        version: packageJson.version,
        env: config.env,
        healthcheck: {
          mongodb: mongodbStatus,
        },
      });
    })
  );

  app.use(errorMiddleware());

  return app;
};
