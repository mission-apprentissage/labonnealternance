import express from "express";
import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import bodyParser from "body-parser";
import config from "../config.js";
import { logger } from "../common/logger.js";
import { logMiddleware } from "./middlewares/logMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { corsMiddleware } from "./middlewares/corsMiddleware.js";
import { tryCatch } from "./middlewares/tryCatchMiddleware.js";
import hello from "./routes/helloRoutes.js";
import { dbCollection } from "../common/mongodb.js";
import { packageJson } from "../common/esm.js";
import { limiter3PerSecond, limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument  from "../api-docs/swagger.json" assert { type: 'json' };;


export default async () => {

  const app = express();

  Sentry.init({
    dsn: config.private.serverSentryDsn,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
  });

  app.set("trust proxy", 1);

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  app.use(bodyParser.json());

  app.use(corsMiddleware());

  app.use(logMiddleware());
  app.use(hello());
  
  app.use(errorMiddleware());
  
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

  /**
   * Bloc LBA J
   */

   const limiter3PerSecond = rateLimit({
    windowMs: 1000, // 1 second
    max: 3, // limit each IP to 3 requests per windowMs
  });

  const limiter1Per20Second = rateLimit({
    windowMs: 20000, // 20 seconds
    max: 1, // limit each IP to 1 request per windowMs
  });

  const limiter5PerSecond = rateLimit({
    windowMs: 1000, // 1 second
    max: 5, // limit each IP to 5 requests per windowMs
  });
  const limiter7PerSecond = rateLimit({
    windowMs: 1000, // 1 second
    max: 7, // limit each IP to 7 requests per windowMs
  });
  const limiter10PerSecond = rateLimit({
    windowMs: 1000, // 1 second
    max: 10, // limit each IP to 10 requests per windowMs
  });

  const limiter20PerSecond = rateLimit({
    windowMs: 1000, // 1 second
    max: 20, // limit each IP to 20 requests per windowMs
  });
  

  /**
   * TODO: to be removed
   */
  /*app.use(bodyParser.text({ type: "application/x-ndjson" }));
  app.use("/api/v1/es/search", limiter3PerSecond, esSearch());*/
  /** */

  const swaggerUi = require("swagger-ui-express");
  const swaggerDocument = require("../api-docs/swagger.json");

  app.get("/api-docs/swagger.json", (req, res) => {
    res.sendFile(path.resolve("./src/api-docs/swagger.json"));
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/api/version", limiter3PerSecond, version());

  app.use("/api/faq", limiter5PerSecond, faq());

  app.use("/api/error500", limiter3PerSecond, error500());

  app.use("/api/v1/formations", limiter7PerSecond, formationV1());

  app.use("/api/v1/formationsParRegion", limiter5PerSecond, formationRegionV1());

  app.use("/api/v1/jobs", limiter5PerSecond, jobV1());

  app.use("/api/v1/jobsEtFormations", limiter5PerSecond, jobEtFormationV1());

  app.use("/api/jobsdiplomas", limiter10PerSecond, jobDiploma());

  app.use("/api/romelabels", limiter10PerSecond, rome());

  app.use("/api/updateRomesMetiers", limiter1Per20Second, updateRomesMetiers());

  app.use("/api/updateLBB", limiter1Per20Second, updateLBB());

  app.use("/api/updateFormations", limiter1Per20Second, updateFormations());

  app.use("/api/updateDiplomesMetiers", limiter1Per20Second, updateDiplomesMetiers());

  app.use("/api/metiers", limiter20PerSecond, metiers());

  app.use("/api/v1/metiers", limiter20PerSecond, metiers());

  app.use("/api/mail", limiter1Per20Second, sendMail(components));

  app.use("/api/application", sendApplication(components));
  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components));
  /**
   * FIN Bloc LBA J
   */



  return app;
};
