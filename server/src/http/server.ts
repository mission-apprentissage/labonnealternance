// @ts-nocheck
import Sentry from "@sentry/node"
import Tracing from "@sentry/tracing"
import express from "express"
import { readFileSync } from "fs"
import path from "path"
import swaggerDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import __dirname from "../common/dirname.js"
import { logger } from "../common/logger.js"
import config from "../config.js"
import { RegisterRoutes } from "../generated/routes.js"
import { initSendinblueWebhooks } from "../service/sendinblue/webhookSendinBlue.js"
import { corsMiddleware } from "./middlewares/corsMiddleware.js"
import { errorMiddleware } from "./middlewares/errorMiddleware.js"
import { logMiddleware } from "./middlewares/logMiddleware.js"
import { tryCatch } from "./middlewares/tryCatchMiddleware.js"
import admin from "./routes/admin/admin.controller.js"
import appointmentRoute from "./routes/admin/appointment.controller.js"
import adminEtablissementRoute from "./routes/admin/etablissement.controller.js"
import eligibleTrainingsForAppointmentRoute from "./routes/admin/widgetParameter.controller.js"
import appointmentRequestRoute from "./routes/appointmentRequest.controller.js"
import emailsRoute from "./routes/auth/emails.controller.js"
import login from "./routes/auth/login.controller.js"
import password from "./routes/auth/password.controller.js"
import campaignWebhook from "./routes/campaignWebhook.controller.js"
import catalogueRoute from "./routes/catalogue.controller.js"
import constantsRoute from "./routes/constants.controller.js"
import etablissementRoute from "./routes/etablissement.controller.js"
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.controller.js"
import formationRegionV1 from "./routes/formationRegionV1.controller.js"
import formationV1 from "./routes/formationV1.controller.js"
import formulaireRoute from "./routes/formulaire.controller.js"
import jobEtFormationV1 from "./routes/jobEtFormationV1.controller.js"
import jobV1 from "./routes/jobV1.controller.js"
import metiers from "./routes/metiers.controller.js"
import metiersDAvenir from "./routes/metiersDAvenir.controller.js"
import optoutRoute from "./routes/optout.controller.js"
import partnersRoute from "./routes/partners.controller.js"
import rome from "./routes/rome.controller.js"
import sendApplication from "./routes/sendApplication.controller.js"
import sendApplicationAPI from "./routes/sendApplicationAPI.controller.js"
import unsubscribeBonneBoite from "./routes/unsubscribeBonneBoite.controller.js"
import sendMail from "./routes/sendMail.controller.js"
import supportRoute from "./routes/support.controller.js"
import updateLBB from "./routes/updateLBB.controller.js"
import userRoute from "./routes/user.controller.js"
import version from "./routes/version.controller.js"
import trainingLinks from "./routes/trainingLinks.controller.js"
import { limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter3PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters.js"

/**
 * LBA-Candidat Swagger file
 */
const dirname = __dirname(import.meta.url)
const deprecatedSwaggerDocument = JSON.parse(readFileSync(path.resolve(dirname, "../assets/api-docs/swagger.json")))
const swaggerDocument = JSON.parse(readFileSync(path.resolve(dirname, "../generated/swagger.json")))

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
  apis: ["./src/http/routes/api.js", "./src/http/routes/appointmentRequest.js"],
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
    environment: config.env,
    enabled: ["production", "recette"].includes(config.env),
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
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
    res.sendFile(path.resolve(dirname, "../assets/api-docs/swagger.json"))
  })

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  app.use("/api/v1/lba-docs", swaggerUi.serve, swaggerUi.setup(deprecatedSwaggerDocument, swaggerUIOptions))
  app.use("/api/v1/lbar-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUIOptions))

  RegisterRoutes(app)

  /**
   * LBACandidat
   */
  app.use("/api/version", limiter3PerSecond, version())
  app.use("/api/v1/formations", limiter7PerSecond, formationV1())
  app.use("/api/romelabels", limiter10PerSecond, rome())
  app.use("/api/v1/formationsParRegion", limiter5PerSecond, formationRegionV1())
  app.use("/api/v1/jobs", limiter5PerSecond, jobV1())
  app.use("/api/v1/jobsEtFormations", limiter5PerSecond, jobEtFormationV1())
  app.use("/api/metiers", limiter20PerSecond, metiers())
  app.use("/api/v1/metiers", limiter20PerSecond, metiers())
  app.use("/api/updateLBB", limiter1Per20Second, updateLBB())
  app.use("/api/mail", limiter1Per20Second, sendMail(components))
  app.use("/api/campaign/webhook", campaignWebhook(components))
  app.use("/api/application", sendApplication(components))
  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components))
  app.use("/api/metiersdavenir", limiter3PerSecond, metiersDAvenir())
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

  initSendinblueWebhooks()

  app.use(Sentry.Handlers.errorHandler())

  app.use(errorMiddleware())

  return app
}
