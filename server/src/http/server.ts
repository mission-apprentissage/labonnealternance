// @ts-nocheck
import { readFileSync } from "fs"

import { CaptureConsole, ExtraErrorData } from "@sentry/integrations"
import Sentry from "@sentry/node"
import express from "express"
import swaggerDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import __dirname from "../common/dirname"
import { logger } from "../common/logger"
import config from "../config"
// eslint-disable-next-line import/no-unresolved, node/no-unpublished-import
import { RegisterRoutes } from "../generated/routes"
import { initBrevoWebhooks } from "../services/brevo.service"

import rome from "./controllers/metiers/rome.controller"
import { corsMiddleware } from "./middlewares/corsMiddleware"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import { tryCatch } from "./middlewares/tryCatchMiddleware"
import admin from "./routes/admin/admin.controller"
import appointmentRoute from "./routes/admin/appointment.controller"
import adminEtablissementRoute from "./routes/admin/etablissement.controller"
import eligibleTrainingsForAppointmentRoute from "./routes/admin/widgetParameter.controller"
import appointmentRequestRoute from "./routes/appointmentRequest.controller"
import emailsRoute from "./routes/auth/emails.controller"
import login from "./routes/auth/login.controller"
import password from "./routes/auth/password.controller"
import campaignWebhook from "./routes/campaignWebhook.controller"
import catalogueRoute from "./routes/catalogue.controller"
import constantsRoute from "./routes/constants.controller"
import etablissementRoute from "./routes/etablissement.controller"
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.controller"
import formationRegionV1 from "./routes/formationRegionV1.controller"
import formationV1 from "./routes/formationV1.controller"
import formulaireRoute from "./routes/formulaire.controller"
import jobEtFormationV1 from "./routes/jobEtFormationV1.controller"
import optoutRoute from "./routes/optout.controller"
import partnersRoute from "./routes/partners.controller"
import sendApplication from "./routes/sendApplication.controller"
import sendApplicationAPI from "./routes/sendApplicationAPI.controller"
import sendMail from "./routes/sendMail.controller"
import supportRoute from "./routes/support.controller"
import trainingLinks from "./routes/trainingLinks.controller"
import unsubscribeBonneBoite from "./routes/unsubscribeBonneBoite.controller"
import updateLBB from "./routes/updateLBB.controller"
import userRoute from "./routes/user.controller"
import version from "./routes/version.controller"
import { limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter3PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters"

import "../auth/passport-strategy"

/**
 * LBA-Candidat Swagger file
 */
const deprecatedSwaggerDocument = JSON.parse(readFileSync(getStaticFilePath("./api-docs/swagger.json")))
const swaggerDocument = JSON.parse(readFileSync(getStaticFilePath("./generated/swagger.json")))

/**
 * LBA-Recruteur Swagger configuration
 */

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "La bonne alternance - recruteur",
      version: "1.0.0",
      description: `Vous trouverez ici la définition de l'API La bonne alternance recruteur<br/><br/>
      <h3><strong>${config.publicUrl}/api</strong></h3><br/>
      Contact:
      `,
      contact: {
        name: "Mission Nationale pour l'apprentissage",
        url: "https://mission-apprentissage.gitbook.io/general/",
        email: "labonnealternance-contact@apprentissage.beta.gouv.fr",
      },
    },
    servers: [
      {
        url: `${config.publicUrl}/api`,
      },
    ],
  },
  apis: ["./src/http/routes/api", "./src/http/routes/appointmentRequest"],
}

const swaggerSpecification = swaggerDoc(swaggerOptions)

swaggerSpecification.components = {
  // schemas: swaggerRecruteurSchema, // To be fixed, require-all is commonJS only
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "api-key",
    },
  },
}

const swaggerUIOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
}

export default async (components) => {
  const app = express()

  Sentry.init({
    dsn: config.serverSentryDsn,
    tracesSampleRate: 0.1,
    tracePropagationTargets: [/\.apprentissage\.beta\.gouv\.fr$/],
    environment: config.env,
    enabled: config.env === "production",
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Mongoose query tracing
      new Sentry.Integrations.Mongo({ useMongoose: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // enable capture all console api errors
      new CaptureConsole({ levels: ["error"] }),
      // add all extra error data into the event
      new ExtraErrorData({ depth: 8 }),
    ],
  })

  app.set("trust proxy", 1)

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler())
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler())

  app.use(express.json({ limit: "5mb" }))

  app.use(corsMiddleware())

  app.use(logMiddleware())

  app.get(
    "/api",
    tryCatch(async (req, res) => {
      let mongodbStatus

      await components.db
        .collection("logs")
        .stats()
        .then(() => {
          mongodbStatus = true
        })
        .catch((e) => {
          mongodbStatus = false
          logger.error("Healthcheck failed", e)
        })

      return res.json({
        env: config.env,
        healthcheck: {
          mongodb: mongodbStatus,
        },
      })
    })
  )

  /**
   * Swaggers
   */
  app.get("/api-docs/swagger.json", (req, res) => {
    res.sendFile(getStaticFilePath("./api-docs/swagger.json"))
  })

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  app.use("/api/v1/lba-docs", swaggerUi.serve, swaggerUi.setup(deprecatedSwaggerDocument, swaggerUIOptions))
  app.use("/api/v1/lbar-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUIOptions))

  /**
   * rate limiter sur les routes routes
   */
  app.use("/api/v1/metiers", limiter20PerSecond)
  app.use("/api/v1/jobs", limiter5PerSecond)
  //app.use("/api/romelabels", limiter10PerSecond)

  RegisterRoutes(app)

  /**
   * LBACandidat
   */
  app.use("/api/version", limiter3PerSecond, version())
  app.use("/api/v1/formations", limiter7PerSecond, formationV1())
  app.use("/api/romelabels", limiter10PerSecond, rome())
  app.use("/api/v1/formationsParRegion", limiter5PerSecond, formationRegionV1())
  app.use("/api/v1/jobsEtFormations", limiter5PerSecond, jobEtFormationV1())
  app.use("/api/updateLBB", limiter1Per20Second, updateLBB())
  app.use("/api/mail", limiter1Per20Second, sendMail(components))
  app.use("/api/campaign/webhook", campaignWebhook(components))
  app.use("/api/application", sendApplication(components))
  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components))
  app.use("/api/unsubscribe", unsubscribeBonneBoite(components))

  /**
   * Admin / Auth
   */
  app.use("/api/login", login(components))
  app.use("/api/password", password(components))
  app.use("/api/admin", admin())

  /**
   * LBA-Organisme de formation
   */
  app.use("/api/appointment", appointmentRoute(components))
  app.use("/api/admin/etablissements", adminEtablissementRoute(components))
  app.use("/api/etablissements", etablissementRoute(components))
  app.use("/api/appointment-request", appointmentRequestRoute(components))
  app.use("/api/catalogue", catalogueRoute())
  app.use("/api/constants", constantsRoute())
  app.use("/api/widget-parameters", eligibleTrainingsForAppointmentRoute(components))
  app.use("/api/partners", partnersRoute(components))
  app.use("/api/emails", emailsRoute(components))
  app.use("/api/support", supportRoute())

  /**
   * LBA-Recruteur
   */
  app.use("/api/user", userRoute(components))
  app.use("/api/formulaire", formulaireRoute(components))
  app.use("/api/rome", rome())
  app.use("/api/optout", optoutRoute())
  app.use("/api/etablissement", etablissementsRecruteurRoute(components))

  /**
   * Tools
   */
  app.use("/api/trainingLinks", limiter3PerSecond, trainingLinks())

  initBrevoWebhooks()

  app.use(Sentry.Handlers.errorHandler())

  app.use(errorMiddleware())

  return app
}
