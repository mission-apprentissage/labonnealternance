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
import swaggerDoc from "swagger-jsdoc"

import config from "../config"
import { initBrevoWebhooks } from "../services/brevo.service"

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
} as const

const swaggerSpecification = swaggerDoc(swaggerOptions)

swaggerSpecification.components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "api-key",
    },
  },
}

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
      // @ts-ignore invalid definition of document type
      document: generateOpenApiSchema() as OpenAPIV3_1.Document,
    },
    // openapi: {
    //   openapi: "3.1.0",
    // },
    // transform: ({ schema, url, route, swaggerObject }) => {
    //   return { schema: transformedSchema, url: transformedUrl }
    // },
    // transformObject: fastifyZodOpenApiTransformObject,
  }
  await app.register(fastifySwagger, swaggerOpts)

  const swaggerUiOptions: FastifySwaggerUiOptions = {
    routePrefix: "/api/docs",
    theme: {
      // @ts-ignore invalid definition of css theme type
      css: [{ content: ".swagger-ui .topbar { display: none }" }],
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

  coreRoutes(app)

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
  version(app)
  metiers(app)
  rome(app)
  updateLbaCompany(app)
  campaignWebhook(app)
  sendApplication(app)
  sendApplicationAPI(app)
  unsubscribeLbaCompany(app)
  metiersDAvenirRoute(app)
  jobsV1Route(app)
  formationsV1Route(app)
  formationsRegionV1Route(app)
  jobsEtFormationsV1Route(app)

  /**
   * Admin / Auth
   */
  login(app)
  password(app)

  /**
   * LBA-Organisme de formation
   */
  adminAppointmentRoute(app)
  adminEtablissementRoute(app)
  formationsRoute(app)
  eligibleTrainingsForAppointmentRoute(app)
  etablissementRoute(app)
  appointmentRequestRoute(app)
  partnersRoute(app)
  emailsRoute(app)

  /**
   * LBA-Recruteur
   */
  userRoute(app)
  formulaireRoute(app)
  optoutRoute(app)
  etablissementsRecruteurRoute(app)

  trainingLinks(app)

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
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
