import fastifyCors from "@fastify/cors"
import fastifyRateLimt from "@fastify/rate-limit"
import fastifySwagger, { FastifyStaticSwaggerOptions } from "@fastify/swagger"
import fastifySwaggerUI, { FastifySwaggerUiOptions } from "@fastify/swagger-ui"
import Boom from "boom"
import fastify, { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify"
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { OpenAPIV3_1 } from "openapi-types"
import { generateOpenApiSchema } from "shared/helpers/openapi/generateOpenapi"
import { SecurityScheme } from "shared/routes/common.routes"

import config from "../config"
import { initBrevoWebhooks } from "../services/brevo.service"

import appointmentsController from "./controllers/appointments/appointments.controller"
import formationsRegionV1Route from "./controllers/formations/formationRegion.controller"
import formationsV1Route from "./controllers/formations/formations.controller"
import jobsV1Route from "./controllers/jobs/jobs.controller"
import jobsEtFormationsV1Route from "./controllers/jobsEtFormations/jobsEtFormations.controller"
import metiers from "./controllers/metiers/metiers.controller"
import rome from "./controllers/metiers/rome.controller"
// import { corsMiddleware } from "./middlewares/corsMiddleware" // TODO_AB To check
import metiersDAvenirRoute from "./controllers/metiersdavenir/metiersDAvenir.controller"
import { auth } from "./middlewares/authMiddleware"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import adminAppointmentRoute from "./routes/admin/appointment.controller"
import eligibleTrainingsForAppointmentRoute from "./routes/admin/eligibleTrainingsForAppointment.controller"
import adminEtablissementRoute from "./routes/admin/etablissement.controller"
import formationsRoute from "./routes/admin/formations.controller"
import appointmentRequestRoute from "./routes/appointmentRequest.controller"
import emailsRoute from "./routes/auth/emails.controller"
import login from "./routes/auth/login.controller"
import password from "./routes/auth/password.controller"
import campaignWebhook from "./routes/campaignWebhook.controller"
import { coreRoutes } from "./routes/core.controller"
import etablissementRoute from "./routes/etablissement.controller"
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.controller"
import formulaireRoute from "./routes/formulaire.controller"
import optoutRoute from "./routes/optout.controller"
import partnersRoute from "./routes/partners.controller"
import sendApplication from "./routes/sendApplication.controller"
import sendApplicationAPI from "./routes/sendApplicationAPI.controller"
import trainingLinks from "./routes/trainingLinks.controller"
import unsubscribeLbaCompany from "./routes/unsubscribeLbaCompany.controller"
import updateLbaCompany from "./routes/updateLbaCompany.controller"
import userRoute from "./routes/user.controller"
import version from "./routes/version.controller"
import { initSentryFastify } from "./sentry"

export interface Server
  extends FastifyInstance<RawServerDefault, RawRequestDefaultExpression<RawServerDefault>, RawReplyDefaultExpression<RawServerDefault>, FastifyBaseLogger, ZodTypeProvider> {}

export async function bind(app: Server) {
  initSentryFastify(app)

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifyRateLimt, {
    global: false,
  })

  const swaggerOpts: FastifyStaticSwaggerOptions = {
    mode: "static",
    specification: {
      // @ts-expect-error invalid definition of document type
      document: generateOpenApiSchema(config.version, config.env, config.env === "local" ? "http://localhost:5001/api" : `${config.publicUrl}/api`) as OpenAPIV3_1.Document,
    },
  }
  await app.register(fastifySwagger, swaggerOpts)

  const swaggerUiOptions: FastifySwaggerUiOptions = {
    routePrefix: "/api/docs",
    theme: {
      // @ts-expect-error invalid definition of css theme type
      css: [{ content: ".swagger-ui .topbar { display: none }" }],
    },
    uiConfig: {
      displayOperationId: true,
      operationsSorter: "method",
      tagsSorter: "alpha",
    },
  }
  await app.register(fastifySwaggerUI, swaggerUiOptions)

  app.decorate("auth", (strategy: SecurityScheme) => auth(strategy))

  // TODO_AB To check
  // app.register(fastifyCors, {
  //   origin: "*",
  // })

  if (config.env === "local") {
    app.register(fastifyCors, {
      origin: config.publicUrl,
      credentials: true,
    })
  }

  app.register(
    (subApp, _, done) => {
      const typedSubApp = subApp.withTypeProvider<ZodTypeProvider>()
      coreRoutes(typedSubApp)

      /**
       * Swaggers
       */
      // app.get("/api-docs/swagger.json", (req, res) => {
      //   res.sendFile(getStaticFilePath("./api-docs/swagger.json"))
      // })

      // app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
      // app.use("/api/v1/lba-docs", swaggerUi.serve, swaggerUi.setup(deprecatedSwaggerDocument, swaggerUIOptions))
      // app.use("/api/v1/lbar-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUIOptions))

      /**
       * LBACandidat
       */
      version(typedSubApp)
      metiers(typedSubApp)
      rome(typedSubApp)
      updateLbaCompany(typedSubApp)
      campaignWebhook(typedSubApp)
      sendApplication(typedSubApp)
      sendApplicationAPI(typedSubApp)
      unsubscribeLbaCompany(typedSubApp)
      metiersDAvenirRoute(typedSubApp)
      jobsV1Route(typedSubApp)
      formationsV1Route(typedSubApp)
      formationsRegionV1Route(typedSubApp)
      jobsEtFormationsV1Route(typedSubApp)

      /**
       * Admin / Auth
       */
      login(typedSubApp)
      password(typedSubApp)

      /**
       * LBA-Organisme de formation
       */
      adminAppointmentRoute(typedSubApp)
      adminEtablissementRoute(typedSubApp)
      formationsRoute(typedSubApp)
      eligibleTrainingsForAppointmentRoute(typedSubApp)
      etablissementRoute(typedSubApp)
      appointmentRequestRoute(typedSubApp)
      partnersRoute(typedSubApp)
      emailsRoute(typedSubApp)

      appointmentsController(typedSubApp)

      /**
       * LBA-Recruteur
       */
      userRoute(typedSubApp)
      formulaireRoute(typedSubApp)
      optoutRoute(typedSubApp)
      etablissementsRecruteurRoute(typedSubApp)

      trainingLinks(typedSubApp)
      done()
    },
    { prefix: "/api" }
  )

  initBrevoWebhooks()

  app.setNotFoundHandler((req, res) => {
    res.status(404).send(Boom.notFound().output)
  })

  errorMiddleware(app)
  return app
}

export default async () => {
  const app: Server = fastify({
    logger: logMiddleware(),
    bodyLimit: 5 * 1024 ** 2, // 5MB
    trustProxy: 1,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
