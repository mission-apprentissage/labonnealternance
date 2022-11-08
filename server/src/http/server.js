import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import bodyParser from "body-parser";
import express from "express";
import { readFileSync } from "fs";
import cron from "node-cron";
import path from "path";
import swaggerDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { logger } from "../common/logger.js";
import config from "../config.js";
import { activateOptOutEtablissementFormations } from "../cron/activateOptOutEtablissementFormations.js";
import { inviteEtablissementToOptOut } from "../cron/inviteEtablissementToOptOut.js";
import { inviteEtablissementToPremium } from "../cron/inviteEtablissementToPremium.js";
import { inviteEtablissementToPremiumFollowUp } from "../cron/inviteEtablissementToPremiumFollowUp.js";
import { parcoursupEtablissementStat } from "../cron/parcoursupEtablissementStat.js";
import { syncEtablissementsAndFormations } from "../cron/syncEtablissementsAndFormations.js";
import { initWebhook } from "../service/sendinblue/webhookSendinBlue.js";
import { roles } from "./../common/roles.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import { corsMiddleware } from "./middlewares/corsMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { logMiddleware } from "./middlewares/logMiddleware.js";
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js";
import { tryCatch } from "./middlewares/tryCatchMiddleware.js";
import admin from "./routes/admin/admin.js";
import appointmentRoute from "./routes/admin/appointment.js";
import adminEtablissementRoute from "./routes/admin/etablissement.js";
import widgetParameterRoute from "./routes/admin/widgetParameter.js";
import appointmentRequestRoute from "./routes/appointmentRequest.js";
import authentified from "./routes/auth/authentified.js";
import emailsRoute from "./routes/auth/emails.js";
import login from "./routes/auth/login.js";
import password from "./routes/auth/password.js";
import catalogueRoute from "./routes/catalogue.js";
import constantsRoute from "./routes/constants.js";
import error500 from "./routes/error500.js";
import etablissementRoute from "./routes/etablissement.js";
import faq from "./routes/faq.js";
import formationRegionV1 from "./routes/formationRegionV1.js";
import formationV1 from "./routes/formationV1.js";
import jobDiploma from "./routes/jobDiploma.js";
import jobEtFormationV1 from "./routes/jobEtFormationV1.js";
import jobV1 from "./routes/jobV1.js";
import metiers from "./routes/metiers.js";
import partnersRoute from "./routes/partners.js";
import rome from "./routes/rome.js";
import sendApplication from "./routes/sendApplication.js";
import sendApplicationAPI from "./routes/sendApplicationAPI.js";
import sendMail from "./routes/sendMail.js";
import supportRoute from "./routes/support.js";
import updateDiplomesMetiers from "./routes/updateDiplomesMetiers.js";
import updateFormations from "./routes/updateFormations.js";
import updateLBB from "./routes/updateLBB.js";
import updateRomesMetiers from "./routes/updateRomesMetiers.js";
import version from "./routes/version.js";

import apiRoute from "./routes/api.js";
import esSearchRoute from "./routes/esSearch.js";
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.js";
import formulaireRoute from "./routes/formulaire.js";
import loginRoute from "./routes/login.js";
import optoutRoute from "./routes/optout.js";
import userRoute from "./routes/user.js";

import __dirname from "../common/dirname.js";
import {
  limiter10PerSecond,
  limiter1Per20Second,
  limiter20PerSecond,
  limiter3PerSecond,
  limiter5PerSecond,
  limiter7PerSecond,
} from "./utils/rateLimiters.js";

/**
 * LBA-Candidat Swagger file
 */
const dirname = __dirname(import.meta.url);
const swaggerDocument = JSON.parse(readFileSync(path.resolve(dirname, "../api-docs/swagger.json")));

/**
 * LBA-Recruteur Swagger configuration
 */

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "La bonne alternance - recruteur",
      version: "1.0.0",
      description: `Vous trouverez ici la définition de l'api La bonne alternance recruteur<br/><br/>
      <h3><strong>${config.publicUrl}/api/v1</strong></h3><br/>
      Contact:
      `,
      contact: {
        name: "Mission Nationale pour l'apprentissage",
        url: "https://mission-apprentissage.gitbook.io/general/",
        email: "nepasrepondre@apprentissage.beta.gouv.fr",
      },
    },
    servers: [
      {
        url: `${config.publicUrl}/api/v1`,
      },
    ],
  },
  apis: ["./src/http/routes/api.js"],
};

const swaggerSpecification = swaggerDoc(swaggerOptions);

swaggerSpecification.components = {
  // schemas: swaggerRecruteurSchema, // To be fixed, require-all is commonJS only
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "api-key",
    },
  },
};

const swaggerUIOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
};

export default async (components) => {
  const app = express();

  const checkJwtToken = authMiddleware(components);
  const adminOnly = permissionsMiddleware(roles.administrator);

  Sentry.init({
    dsn: config.serverSentryDsn,
    environment: config.env,
    enabled: ["production", "recette"].includes(config.env),
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
        healthcheck: {
          mongodb: mongodbStatus,
        },
      });
    })
  );

  /**
   * Swaggers
   */
  app.get("/api-docs/swagger.json", (req, res) => {
    res.sendFile(path.resolve(dirname, "../api-docs/swagger.json"));
  });
  app.use("/api/v1/lba-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUIOptions));
  app.use("/api/v1/lbar-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUIOptions));

  /**
   * LBACandidat
   */
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

  /**
   * Admin / Auth
   */
  app.use("/api/login", login(components));
  app.use("/api/password", password(components));
  app.use("/api/authentified", checkJwtToken, authentified());
  app.use("/api/admin", checkJwtToken, adminOnly, admin());

  /**
   * LBA-Organisme de formation
   */
  app.use("/api/appointment", appointmentRoute(components));
  app.use("/api/admin/etablissements", checkJwtToken, adminOnly, adminEtablissementRoute(components));
  app.use("/api/etablissements", etablissementRoute(components));
  app.use("/api/appointment-request", appointmentRequestRoute(components));
  app.use("/api/catalogue", catalogueRoute());
  app.use("/api/constants", constantsRoute());
  app.use("/api/widget-parameters", checkJwtToken, adminOnly, widgetParameterRoute(components));
  app.use("/api/partners", partnersRoute(components));
  app.use("/api/emails", emailsRoute(components));
  app.use("/api/support", supportRoute());

  /**
   * LBA-Recruteur
   */
  app.use("/api/v1", apiRoute(components));

  app.use("/api/user", userRoute(components));
  app.use("/api/authentification", loginRoute(components)); // ex /api/login LBA-R
  app.use("/api/formulaire", formulaireRoute(components));
  app.use("/api/es/search", esSearchRoute());
  app.use("/api/rome", rome());
  app.use("/api/optout", optoutRoute());
  app.use("/api/etablissementsRecruteur", etablissementsRecruteurRoute(components));

  /**
   * RDV-Apprentissage: cron
   * Note: Will be rewritten.
   *
   * KBA : to be transfered to infra.
   */
  // Everyday at 14:00: Opt-out invite
  cron.schedule("0 14 * * *", () => inviteEtablissementToOptOut(components));

  // Everyday at 04:00 AM: Copy catalogue formations
  cron.schedule("0 4 * * *", () => syncEtablissementsAndFormations(components));

  // Everyday, every 5 minutes: Opt-out activation
  cron.schedule("*/5 * * * *", () => activateOptOutEtablissementFormations(components));

  // Everyday at 6AM create Parcoursup stats
  cron.schedule("0 6 * * *", () => parcoursupEtablissementStat(components));

  // Every hours: Invite to Premium mode
  cron.schedule("0 * * * *", () => inviteEtablissementToPremium(components));

  // Every hours: Invite to Premium mode (follow up)
  cron.schedule("0 * * * *", () => inviteEtablissementToPremiumFollowUp(components));

  initWebhook();

  app.use(errorMiddleware());

  return app;
};
