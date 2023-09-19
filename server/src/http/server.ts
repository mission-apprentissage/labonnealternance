// @ts-nocheck
import { readFileSync } from "fs"

import Sentry from "@sentry/node"
import Boom from "boom"
import express from "express"
import swaggerDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import "../auth/passport-strategy"
import { logger } from "../common/logger"
import config from "../config"
import { RegisterRoutes } from "../generated/routes"
import { initBrevoWebhooks } from "../services/brevo.service"
import { ROLES } from "../services/constant.service"

import rome from "./controllers/metiers/rome.controller"
import authMiddleware from "./middlewares/authMiddleware"
import { corsMiddleware } from "./middlewares/corsMiddleware"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import permissionsMiddleware from "./middlewares/permissionsMiddleware"
import { tryCatch } from "./middlewares/tryCatchMiddleware"
import adminAppointmentRoute from "./routes/admin/appointment.controller"
import eligibleTrainingsForAppointmentRoute from "./routes/admin/eligibleTrainingsForAppointment.controller"
import adminEtablissementRoute from "./routes/admin/etablissement.controller"
import formationsRoute from "./routes/admin/formations.controller"
import appointmentRequestRoute from "./routes/appointmentRequest.controller"
import emailsRoute from "./routes/auth/emails.controller"
import login from "./routes/auth/login.controller"
import password from "./routes/auth/password.controller"
import campaignWebhook from "./routes/campaignWebhook.controller"
import constantsRoute from "./routes/constants.controller"
import etablissementRoute from "./routes/etablissement.controller"
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.controller"
import formulaireRoute from "./routes/formulaire.controller"
import optoutRoute from "./routes/optout.controller"
import partnersRoute from "./routes/partners.controller"
import sendApplication from "./routes/sendApplication.controller"
import sendApplicationAPI from "./routes/sendApplicationAPI.controller"
import sendMail from "./routes/sendMail.controller"
import supportRoute from "./routes/support.controller"
import trainingLinks from "./routes/trainingLinks.controller"
import unsubscribeLbaCompany from "./routes/unsubscribeLbaCompany.controller"
import updateLbaCompany from "./routes/updateLbaCompany.controller"
import userRoute from "./routes/user.controller"
import version from "./routes/version.controller"
import { initSentry } from "./sentry"
import { limiter10PerSecond, limiter1Per20Second, limiter20PerSecond, limiter3PerSecond, limiter5PerSecond, limiter7PerSecond } from "./utils/rateLimiters"

/**
 * LBA-Candidat Swagger file
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const deprecatedSwaggerDocument = JSON.parse(readFileSync(getStaticFilePath("./api-docs/swagger.json")))
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

  app.get(
    "/api/healthcheck",
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
  app.use("/api/admin/appointments", checkJwtTokenRdvAdmin, administratorOnly, adminAppointmentRoute())
  app.use("/api/admin/etablissements", checkJwtTokenRdvAdmin, administratorOnly, adminEtablissementRoute())
  app.use("/api/admin/formations", checkJwtTokenRdvAdmin, administratorOnly, formationsRoute())
  app.use("/api/admin/eligible-trainings-for-appointment", checkJwtTokenRdvAdmin, administratorOnly, eligibleTrainingsForAppointmentRoute())
  app.use("/api/etablissements", etablissementRoute())
  app.use("/api/appointment-request", appointmentRequestRoute())
  app.use("/api/constants", constantsRoute())
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

  app.use((req, res) => {
    res.status(404).send(Boom.notFound().output)
  })

  app.use(Sentry.Handlers.errorHandler())

  app.use(errorMiddleware())

  return app
}
