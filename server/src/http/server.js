import express from "express";
import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import bodyParser from "body-parser";
import config from "../config.js";
import { logMiddleware } from "./middlewares/logMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { corsMiddleware } from "./middlewares/corsMiddleware.js";
import hello from "./routes/helloRoutes.js";
import { limiter3PerSecond, limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument  from "../api-docs/swagger.json" assert { type: 'json' };
import version from "./routes/version.js";
import faq from "./routes/faq.js";
import error500 from "./routes/error500.js";
import formationV1 from "./routes/formationV1.js";
import rome from "./routes/rome.js";
import jobDiploma from "./routes/jobDiploma.js";
import updateRomesMetiers from "./routes/updateRomesMetiers.js";
import formationRegionV1 from "./routes/formationRegionV1.js";
import jobV1 from "./routes/jobV1.js";
import jobEtFormationV1 from "./routes/jobEtFormationV1.js";
import metiers from "./routes/metiers.js";
import updateLBB from"./routes/updateLBB.js";
import updateFormations from "./routes/updateFormations.js";
import updateDiplomesMetiers from "./routes/updateDiplomesMetiers.js";

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

  //app.use(logMiddleware());
  app.use(hello());
  
  app.use(errorMiddleware());
  
  /**
   * Bloc LBA J
   */

  app.get("/api-docs/swagger.json", (req, res) => {
    res.sendFile(path.resolve("./src/api-docs/swagger.json"));
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/api/version", limiter3PerSecond, version());

  app.use("/api/faq", limiter5PerSecond, faq());

  app.use("/api/error500", limiter3PerSecond, error500());

  app.use("/api/v1/formations", limiter7PerSecond, formationV1());

  app.use("/api/romelabels", limiter10PerSecond, rome());

  app.use("/api/jobsdiplomas", limiter10PerSecond, jobDiploma());

  app.use("/api/updateRomesMetiers", limiter1Per20Second, updateRomesMetiers());

  app.use("/api/v1/formationsParRegion", limiter5PerSecond, formationRegionV1());

  app.use("/api/v1/jobs", limiter5PerSecond, jobV1());

  app.use("/api/v1/jobsEtFormations", limiter5PerSecond, jobEtFormationV1());

  app.use("/api/metiers", limiter20PerSecond, metiers());
  app.use("/api/v1/metiers", limiter20PerSecond, metiers());

  app.use("/api/updateLBB", limiter1Per20Second, updateLBB());

  app.use("/api/updateFormations", limiter1Per20Second, updateFormations());

  app.use("/api/updateDiplomesMetiers", limiter1Per20Second, updateDiplomesMetiers());

  /*
  app.use("/api/mail", limiter1Per20Second, sendMail(components));

  app.use("/api/application", sendApplication(components));
  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components));*/
  /**
   * FIN Bloc LBA J
   */

  return app;
};
