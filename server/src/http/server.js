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
import { initWebhook } from "../service/sendinblue/webhookSendinBlue.js"
import authMiddleware from "./middlewares/authMiddleware.js"
import { corsMiddleware } from "./middlewares/corsMiddleware.js"
import { errorMiddleware } from "./middlewares/errorMiddleware.js"
import { logMiddleware } from "./middlewares/logMiddleware.js"
import { tryCatch } from "./middlewares/tryCatchMiddleware.js"
import admin from "./routes/admin/admin.js"
import appointmentRoute from "./routes/admin/appointment.js"
import adminEtablissementRoute from "./routes/admin/etablissement.js"
import widgetParameterRoute from "./routes/admin/widgetParameter.js"
import apiRoute from "./routes/api.js"
import appointmentRequestRoute from "./routes/appointmentRequest.js"
import authentified from "./routes/auth/authentified.js"
import emailsRoute from "./routes/auth/emails.js"
import login from "./routes/auth/login.js"
import password from "./routes/auth/password.js"
import catalogueRoute from "./routes/catalogue.js"
import constantsRoute from "./routes/constants.js"
import error500 from "./routes/error500.js"
import esSearchRoute from "./routes/esSearch.js"
import etablissementRoute from "./routes/etablissement.js"
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.js"
import faq from "./routes/faq.js"
import formationRegionV1 from "./routes/formationRegionV1.js"
import formationV1 from "./routes/formationV1.js"
import formulaireRoute from "./routes/formulaire.js"
import jobDiploma from "./routes/jobDiploma.js"
import jobEtFormationV1 from "./routes/jobEtFormationV1.js"
import jobV1 from "./routes/jobV1.js"
import metiers from "./routes/metiers.js"
import optoutRoute from "./routes/optout.js"
import partnersRoute from "./routes/partners.js"
import rome from "./routes/rome.js"
import sendApplication from "./routes/sendApplication.js"
import sendApplicationAPI from "./routes/sendApplicationAPI.js"
import sendMail from "./routes/sendMail.js"
import supportRoute from "./routes/support.js"
import updateLBB from "./routes/updateLBB.js"
import userRoute from "./routes/user.js"
import version from "./routes/version.js"
import { limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter3PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters.js"

/**
 * LBA-Candidat Swagger file
 */
const dirname = __dirname(import.meta.url)
const swaggerDocument = JSON.parse(readFileSync(path.resolve(dirname, "../assets/api-docs/swagger.json")))

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
      <h3><strong>${config.publicUrl}/api</strong></h3><br/>
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

  const checkJwtToken = authMiddleware(components)

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
  app.use("/api/v1/lba-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUIOptions))
  app.use("/api/v1/lbar-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUIOptions))

  /**
   * LBACandidat
   */
  app.use("/api/version", limiter3PerSecond, version())
  app.use("/api/faq", limiter5PerSecond, faq())
  app.use("/api/error500", limiter3PerSecond, error500())
  app.use("/api/v1/formations", limiter7PerSecond, formationV1())
  app.use("/api/romelabels", limiter10PerSecond, rome())
  app.use("/api/jobsdiplomas", limiter10PerSecond, jobDiploma())
  app.use("/api/v1/formationsParRegion", limiter5PerSecond, formationRegionV1())
  app.use("/api/v1/jobs", limiter5PerSecond, jobV1())
  app.use("/api/v1/jobsEtFormations", limiter5PerSecond, jobEtFormationV1())
  app.use("/api/metiers", limiter20PerSecond, metiers())
  app.use("/api/v1/metiers", limiter20PerSecond, metiers())
  app.use("/api/updateLBB", limiter1Per20Second, updateLBB())
  app.use("/api/mail", limiter1Per20Second, sendMail(components))
  app.use("/api/application", sendApplication(components))
  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components))

  /**
   * Admin / Auth
   */
  app.use("/api/login", login(components))
  app.use("/api/password", password(components))
  app.use("/api/authentified", checkJwtToken, authentified())
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
  app.use("/api/widget-parameters", widgetParameterRoute(components))
  app.use("/api/partners", partnersRoute(components))
  app.use("/api/emails", emailsRoute(components))
  app.use("/api/support", supportRoute())

  /**
   * LBA-Recruteur
   */
  app.use("/api/v1", apiRoute(components))

  app.use("/api/user", userRoute(components))
  app.use("/api/formulaire", formulaireRoute(components))
  app.use("/api/es/search", esSearchRoute())
  app.use("/api/rome", rome())
  app.use("/api/optout", optoutRoute())
  app.use("/api/etablissementsRecruteur", etablissementsRecruteurRoute(components))

  initWebhook()

  app.use(errorMiddleware())

  return app
}
