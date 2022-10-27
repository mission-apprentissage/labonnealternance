import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import bodyParser from "body-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../api-docs/swagger.json" assert { type: "json" };
import config from "../config.js";
import { initWebhook } from "../service/sendinblue/webhookSendinBlue.js";
import { corsMiddleware } from "./middlewares/corsMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { tryCatch } from "./middlewares/tryCatchMiddleware.js";
import error500 from "./routes/error500.js";
import faq from "./routes/faq.js";
import formationRegionV1 from "./routes/formationRegionV1.js";
import formationV1 from "./routes/formationV1.js";
import hello from "./routes/helloRoutes.js";
import jobDiploma from "./routes/jobDiploma.js";
import jobEtFormationV1 from "./routes/jobEtFormationV1.js";
import jobV1 from "./routes/jobV1.js";
import metiers from "./routes/metiers.js";
import rome from "./routes/rome.js";
import sendApplication from "./routes/sendApplication.js";
import sendApplicationAPI from "./routes/sendApplicationAPI.js";
import sendMail from "./routes/sendMail.js";
import updateDiplomesMetiers from "./routes/updateDiplomesMetiers.js";
import updateFormations from "./routes/updateFormations.js";
import updateLBB from "./routes/updateLBB.js";
import updateRomesMetiers from "./routes/updateRomesMetiers.js";
import version from "./routes/version.js";


import appointmentRoute from "./routes/admin/appointment";
import adminEtablissementRoute from "./routes/admin/etablissement";
import etablissementRoute from "./routes/etablissement";
import appointmentRequestRoute from "./routes/appointmentRequest";
import catalogueRoute from "./routes/catalogue";
import widgetParameterRoute from "./routes/admin/widgetParameter";
import partnersRoute from "./routes/partners";
import emailsRoute from "./routes/auth/emails";
import constantsRoute from "./routes/constants";
import supportRoute from "./routes/support";










import {
  limiter10PerSecond,
  limiter1Per20Second,
  limiter20PerSecond,
  limiter3PerSecond,
  limiter5PerSecond,
  limiter7PerSecond,
} from "./utils/rateLimiters.js";

export default async (components) => {
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

  app.get(
    "/api",
    tryCatch(async (req, res) => {
      let mongodbStatus;

      await components.db
        .collection("logs")
        .stats()
        .then(() => {
          mongodbStatus = true;
        })
        .catch((e) => {
          mongodbStatus = false;
          logger.error("Healthcheck failed", e);
        });

      return res.json({
        env: config.env,
        catalogue: config.private.catalogueUrl,
        healthcheck: {
          mongodb: mongodbStatus,
        },
      });
    })
  );

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

  app.use("/api/mail", limiter1Per20Second, sendMail(components));

  app.use("/api/application", sendApplication(components));

  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components));


  // RDV-A
  app.use("/api/appointment", appointmentRoute(components));
  app.use("/api/admin/etablissements", checkJwtToken, adminOnly, adminEtablissementRoute(components));
  app.use("/api/etablissements", etablissementRoute(components));
  app.use("/api/appointment-request", appointmentRequestRoute(components));
  app.use("/api/catalogue", catalogueRoute(components));
  app.use("/api/constants", constantsRoute(components));
  app.use("/api/widget-parameters", checkJwtToken, adminOnly, widgetParameterRoute(components));
  app.use("/api/partners", partnersRoute(components));
  app.use("/api/emails", emailsRoute(components));
  app.use("/api/support", supportRoute(components));

  /**
   * FIN Bloc LBA J
   */

  initWebhook();

  return app;
};
