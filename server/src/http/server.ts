// eslint-disable-next-line import/no-unresolved
import fastifyCookie from "@fastify/cookie"
import fastifyCors from "@fastify/cors"
import fastifyRateLimt from "@fastify/rate-limit"
import fastifySwagger, { FastifyStaticSwaggerOptions } from "@fastify/swagger"
import fastifySwaggerUI, { FastifySwaggerUiOptions } from "@fastify/swagger-ui"
import Boom from "boom"
import fastify, { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify"
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { Netmask } from "netmask"
import { OpenAPIV3_1 } from "openapi-types"
import { generateOpenApiSchema } from "shared/helpers/openapi/generateOpenapi"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"

import { localOrigin } from "@/common/utils/isOriginLocal"

import config from "../config"
import { initBrevoWebhooks } from "../services/brevo.service"

import appointmentsController from "./controllers/appointments/appointments.controller"
import formationsRegionV1Route from "./controllers/formations/formationRegion.controller"
import formationsV1Route from "./controllers/formations/formations.controller"
import jobsV1Route from "./controllers/jobs/jobs.controller"
import jobsEtFormationsV1Route from "./controllers/jobsEtFormations/jobsEtFormations.controller"
import metiers from "./controllers/metiers/metiers.controller"
import rome from "./controllers/metiers/rome.controller"
import metiersDAvenirRoute from "./controllers/metiersdavenir/metiersDAvenir.controller"
import { auth } from "./middlewares/authMiddleware"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import adminAppointmentRoute from "./routes/admin/appointment.controller"
import eligibleTrainingsForAppointmentRoute from "./routes/admin/eligibleTrainingsForAppointment.controller"
import adminEtablissementRoute from "./routes/admin/etablissement.controller"
import formationsRoute from "./routes/admin/formations.controller"
import application from "./routes/application.controller"
import applicationAPI from "./routes/applicationAPI.controller"
import appointmentRequestRoute from "./routes/appointmentRequest.controller"
import emailsRoute from "./routes/auth/emails.controller"
import login from "./routes/auth/login.controller"
import campaignWebhook from "./routes/campaignWebhook.controller"
import { coreRoutes } from "./routes/core.controller"
import etablissementRoute from "./routes/etablissement.controller"
import etablissementsRecruteurRoute from "./routes/etablissementRecruteur.controller"
import formulaireRoute from "./routes/formulaire.controller"
import optoutRoute from "./routes/optout.controller"
import partnersRoute from "./routes/partners.controller"
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

  const allowedIps = [new Netmask("127.0.0.0/16"), new Netmask("10.0.0.0/8"), new Netmask("172.16.0.0/12"), new Netmask("192.168.0.0/16")]
  await app.register(fastifyRateLimt, {
    global: false,
    allowList: (req) => {
      // Do not rate-limit private & internal IPs
      return allowedIps.some((block) => block.contains(req.ip))
    },
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

  app.get("/api-docs/swagger.json", (_req, res) => {
    return res.redirect(301, "/api/docs/json")
  })

  app.register(fastifyCookie)

  app.decorate("auth", <S extends IRouteSchema & WithSecurityScheme>(scheme: S) => auth(scheme))

  if (config.env === "local") {
    app.register(fastifyCors, {
      origin: config.publicUrl,
      credentials: true,
    })
  } else {
    app.register(fastifyCors, {
      origin: [...localOrigin, /\.gouv\.fr$/],
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
      application(typedSubApp)
      applicationAPI(typedSubApp)
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

export default async (): Promise<Server> => {
  const app: Server = fastify({
    logger: logMiddleware(),
    trustProxy: 1,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
