// eslint-disable-next-line import/no-unresolved
import fastifyCookie from "@fastify/cookie"
import fastifyCors from "@fastify/cors"
import fastifyRateLimt from "@fastify/rate-limit"
import fastifySwagger, { FastifyStaticSwaggerOptions } from "@fastify/swagger"
import fastifySwaggerUI, { FastifySwaggerUiOptions } from "@fastify/swagger-ui"
import { notFound } from "@hapi/boom"
import fastify, { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify"
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { Netmask } from "netmask"
import { OpenAPIV3_1 } from "openapi-types"
import { generateOpenApiSchema } from "shared/helpers/openapi/generateOpenapi"
import { setZodLanguage } from "shared/helpers/zodWithOpenApi"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"

import { localOrigin } from "@/common/utils/isOriginLocal"

import { initSentryFastify } from "../common/sentry/sentry.fastify"
import config from "../config"
import { initBrevoWebhooks } from "../services/brevo.service"

import eligibleTrainingsForAppointmentRoute from "./controllers/admin/eligibleTrainingsForAppointment.controller"
import adminEtablissementRoute from "./controllers/admin/etablissement.controller"
import formationsRoute from "./controllers/admin/formations.controller"
import application from "./controllers/application.controller"
import appointmentRequestRoute from "./controllers/appointmentRequest.controller"
import { coreRoutes } from "./controllers/core.controller"
import emailsRoute from "./controllers/emails.controller"
import etablissementRoute from "./controllers/etablissement.controller"
import etablissementsRecruteurRoute from "./controllers/etablissementRecruteur.controller"
import formationsRegionV1Route from "./controllers/formationRegion.controller"
import formationsV1Route from "./controllers/formations.controller"
import formationsRouteV2 from "./controllers/formations.controller.v2"
import formulaireRoute from "./controllers/formulaire.controller"
import jobsV1Route from "./controllers/jobs.controller"
import jobsEtFormationsV1Route from "./controllers/jobsEtFormations.controller"
import jobsEtFormationsRouteV2 from "./controllers/jobsEtFormations.controller.v2"
import login from "./controllers/login.controller"
import metiers from "./controllers/metiers.controller"
import metierv2 from "./controllers/metiers.controller.v2"
import metiersDAvenirRoute from "./controllers/metiersDAvenir.controller"
import optoutRoute from "./controllers/optout.controller"
import partnersRoute from "./controllers/partners.controller"
import reportedCompanyController from "./controllers/reportedCompany.controller"
import rome from "./controllers/rome.controller"
import sitemapController from "./controllers/sitemap.controller"
import trainingLinks from "./controllers/trainingLinks.controller"
import unsubscribeLbaCompany from "./controllers/unsubscribeRecruteurLba.controller"
import updateLbaCompany from "./controllers/updateRecruteurLba.controller"
import userRoute from "./controllers/user.controller"
import applicationRouteV2 from "./controllers/v2/application.controller.v2"
import appointmentRequestRouteV2 from "./controllers/v2/appointment.controller.v2"
import jobsRouteV2 from "./controllers/v2/jobs.controller.v2"
import { jobsApiV3Routes } from "./controllers/v3/jobs/jobs.controller.v3"
import version from "./controllers/version.controller"
import { auth } from "./middlewares/authMiddleware"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"

export interface Server
  extends FastifyInstance<RawServerDefault, RawRequestDefaultExpression<RawServerDefault>, RawReplyDefaultExpression<RawServerDefault>, FastifyBaseLogger, ZodTypeProvider> {}

export async function bind(app: Server) {
  initSentryFastify(app)
  setZodLanguage("en")
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
      sitemapController(typedSubApp)

      /**
       * LBACandidat
       */
      version(typedSubApp)
      metiers(typedSubApp)
      rome(typedSubApp)
      updateLbaCompany(typedSubApp)
      application(typedSubApp)
      unsubscribeLbaCompany(typedSubApp)
      metiersDAvenirRoute(typedSubApp)
      jobsV1Route(typedSubApp)
      formationsV1Route(typedSubApp)
      formationsRegionV1Route(typedSubApp)
      jobsEtFormationsV1Route(typedSubApp)
      reportedCompanyController(typedSubApp)

      /**
       * Admin / Auth
       */
      login(typedSubApp)

      /**
       * LBA-Organisme de formation
       */
      adminEtablissementRoute(typedSubApp)
      formationsRoute(typedSubApp)
      eligibleTrainingsForAppointmentRoute(typedSubApp)
      etablissementRoute(typedSubApp)
      appointmentRequestRoute(typedSubApp)
      partnersRoute(typedSubApp)
      emailsRoute(typedSubApp)

      /**
       * LBA-Recruteur
       */
      userRoute(typedSubApp)
      formulaireRoute(typedSubApp)
      optoutRoute(typedSubApp)
      etablissementsRecruteurRoute(typedSubApp)

      trainingLinks(typedSubApp)
      jobsApiV3Routes(typedSubApp)
      applicationRouteV2(typedSubApp)
      appointmentRequestRouteV2(typedSubApp)

      done()
    },
    { prefix: "/api" }
  )

  /**
   * API V2
   * Routé dédié à la passerelle API Apprentissage
   */
  app.register(
    (subApp, _, done) => {
      const typedSubApp = subApp.withTypeProvider<ZodTypeProvider>()
      metierv2(typedSubApp)
      jobsEtFormationsRouteV2(typedSubApp)
      formationsRouteV2(typedSubApp)
      jobsRouteV2(typedSubApp)
      done()
    },
    { prefix: "/api/v2" }
  )

  initBrevoWebhooks()

  app.setNotFoundHandler((req, res) => {
    res.status(404).send(notFound().output)
  })

  errorMiddleware(app)
  return app
}

export const bindFastifyServer = async (): Promise<Server> => {
  const app: Server = fastify({
    logger: logMiddleware(),
    trustProxy: 1,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
