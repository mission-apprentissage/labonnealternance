import express from "express"
import { readFileSync } from "fs"
import path from "path"
import swaggerDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import __dirname from "../common/dirname.js"
import { logger } from "../common/logger.js"
import config from "../config.js"
import { RegisterRoutes } from "../generated/routes.js"
import { corsMiddleware } from "./middlewares/corsMiddleware.js"
import { errorMiddleware } from "./middlewares/errorMiddleware.js"
import { logMiddleware } from "./middlewares/logMiddleware.js"
import { tryCatch } from "./middlewares/tryCatchMiddleware.js"
import adminAppointmentRoute from "./routes/admin/appointment.controller.js"
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
import formulaireRoute from "./routes/formulaire.controller.js"
import optoutRoute from "./routes/optout.controller.js"
import partnersRoute from "./routes/partners.controller.js"
import rome from "./controllers/metiers/rome.controller.js"
import sendApplication from "./routes/sendApplication.controller.js"
import sendApplicationAPI from "./routes/sendApplicationAPI.controller.js"
import unsubscribeLbaCompany from "./routes/unsubscribeLbaCompany.controller.js"
import sendMail from "./routes/sendMail.controller.js"
import supportRoute from "./routes/support.controller.js"
import updateLbaCompany from "./routes/updateLbaCompany.controller.js"
import userRoute from "./routes/user.controller.js"
import version from "./routes/version.controller.js"
import trainingLinks from "./routes/trainingLinks.controller.js"
import { limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter3PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters.js"
import { initBrevoWebhooks } from "../services/brevo.service.js"

import "../auth/passport-strategy.js"
import { initSentry } from "./sentry.js"
import authMiddleware from "./middlewares/authMiddleware.js"
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js"
import { ROLES } from "../services/constant.service.js"

/**
 * LBA-Candidat Swagger file
 */
const dirname = __dirname(import.meta.url)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const deprecatedSwaggerDocument = JSON.parse(readFileSync(path.resolve(dirname, "../assets/api-docs/swagger.json")))
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

  const checkJwtTokenRdvAdmin = authMiddleware("jwt-rdv-admin")
  const administratorOnly = permissionsMiddleware(ROLES.administrator)

  initSentry(app)

  app.set("trust proxy", 1)

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

  /**
   * rate limiter sur les routes routes
   */
  app.use("/api/v1/metiers", limiter20PerSecond)
  app.use("/api/v1/jobs", limiter5PerSecond)
  app.use("/api/v1/formations", limiter7PerSecond)
  app.use("/api/v1/formationsParRegion", limiter5PerSecond)
  app.use("/api/v1/jobsEtFormations", limiter5PerSecond)
  //app.use("/api/romelabels", limiter10PerSecond)

  RegisterRoutes(app)

  /**
   * LBACandidat
   */
  app.use("/api/version", limiter3PerSecond, version())
  app.use("/api/romelabels", limiter10PerSecond, rome())
  app.use("/api/updateLBB", limiter1Per20Second, updateLbaCompany())
  app.use("/api/mail", limiter1Per20Second, sendMail())
  app.use("/api/campaign/webhook", campaignWebhook())
  app.use("/api/application", sendApplication(components))
  app.use("/api/V1/application", limiter5PerSecond, sendApplicationAPI(components))
  app.use("/api/unsubscribe", unsubscribeLbaCompany())

  /**
   * Admin / Auth
   */
  app.use("/api/login", login())
  app.use("/api/password", password())

  /**
   * LBA-Organisme de formation
   */
  app.use("/api/admin/appointment", checkJwtTokenRdvAdmin, administratorOnly, adminAppointmentRoute())
  app.use("/api/admin/etablissements", checkJwtTokenRdvAdmin, administratorOnly, adminEtablissementRoute())
  app.use("/api/etablissements", etablissementRoute())
  app.use("/api/appointment-request", appointmentRequestRoute())
  app.use("/api/catalogue", catalogueRoute())
  app.use("/api/constants", constantsRoute())
  app.use("/api/widget-parameters", eligibleTrainingsForAppointmentRoute())
  app.use("/api/partners", partnersRoute())
  app.use("/api/emails", emailsRoute())
  app.use("/api/support", supportRoute())

  /**
   * LBA-Recruteur
   */
  app.use("/api/user", userRoute())
  app.use("/api/formulaire", formulaireRoute())
  app.use("/api/rome", rome())
  app.use("/api/optout", optoutRoute())
  app.use("/api/etablissement", etablissementsRecruteurRoute())

  /**
   * Tools
   */
  app.use("/api/trainingLinks", limiter3PerSecond, trainingLinks())

  initBrevoWebhooks()

  app.use(errorMiddleware())

  return app
}
