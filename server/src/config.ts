import env from "env-var"

const config = {
  version: env.get("PUBLIC_VERSION").required().asString(),
  commitHash: env.get("COMMIT_HASH").required().asString(),
  port: env.get("LBA_SERVER_PORT").required().asPortNumber(),
  env: env.get("LBA_ENV").required().asEnum(["local", "recette", "pentest", "production", "preview"]),
  publicUrl: env.get("LBA_PUBLIC_URL").required().asString(),
  outputDir: env.get("LBA_OUTPUT_DIR").required().asString(),
  formationsEndPoint: "/api/v1/entity/formations",
  publicEmail: "labonnealternance@apprentissage.beta.gouv.fr",
  transactionalEmail: "nepasrepondre@apprentissage.beta.gouv.fr",
  transactionalEmailSender: "La bonne alternance",
  disable_processors: env.get("LBA_DISABLE_PROCESSORS").required().asBool(),
  log: {
    level: env.get("LBA_LOG_LEVEL").required().asString(),
    format: env.get("LBA_LOG_FORMAT").required().asString(),
    destinations: env.get("LBA_LOG_DESTINATIONS").required().asArray(),
    type: env.get("LBA_LOG_TYPE").required().asString(),
  },
  slackWebhookUrl: env.get("LBA_SLACK_WEBHOOK_URL").asString(),
  jobSlackWebhook: env.get("LBA_JOB_SLACK_WEBHOOK").asString(),
  mongodb: {
    uri: env.get("LBA_MONGODB_URI").required().asString(),
  },
  catalogueUrl: env.get("LBA_CATALOGUE_URL").required().asString(),
  serverSentryDsn: env.get("LBA_SERVER_SENTRY_DSN").required().asString(),
  lbaSecret: env.get("LBA_SECRET").required().asString(),
  allowedSources: env.get("LBA_ALLOWED_SOURCES").required().asString(),
  esdClientId: env.get("LBA_ESD_CLIENT_ID").required().asString(),
  esdClientSecret: env.get("LBA_ESD_CLIENT_SECRET").required().asString(),
  worker: env.get("INSTANCE_ID").asString(),
  smtp: {
    host: env.get("LBA_SMTP_HOST").required().asString(),
    port: env.get("LBA_SMTP_PORT").required().asPortNumber(),
    auth: {
      user: env.get("LBA_SMTP_AUTH_USER").required().asString(),
      pass: env.get("LBA_SMTP_AUTH_PASS").required().asString(),
    },
    brevoWebhookApiKey: env.get("LBA_BREVO_WEBHOOK_API_KEY").required().asString(),
    brevoApiKey: env.get("LBA_BREVO_API_KEY").required().asString(),
    brevoContactListId: env.get("LBA_BREVO_CONTACT_LIST_ID").asString(),
  },
  auth: {
    passwordHashRounds: env.get("LBA_AUTH_PASSWORD_HASH_ROUNDS").required().asInt(),
    user: {
      jwtSecret: env.get("LBA_AUTH_USER_JWT_SECRET").required().asString(),
      expiresIn: env.get("LBA_AUTH_USER_JWT_SECRET_EXPIRES").required().asString(),
    },
    apiApprentissage: {
      publicKey: env.get("LBA_API_APPRENTISSAGE_PUBLIC_KEY").required().asString(),
    },
    session: {
      cookieName: "lba_session",
      cookie: {
        maxAge: 30 * 24 * 3600000,
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true,
      },
    },
  },
  ftp: {
    host: env.get("LBA_FTP_HOST").required().asString(),
    constructys: {
      user: env.get("LBA_FTP_CONSTRUCTYS_USER").required().asString(),
      password: env.get("LBA_FTP_CONSTRUCTYS_PASSWORD").required().asString(),
    },
    ocapiat: {
      user: env.get("LBA_FTP_OCAPIAT_USER").required().asString(),
      password: env.get("LBA_FTP_OCAPIAT_PASSWORD").required().asString(),
    },
  },
  diagoriente: {
    clientId: env.get("LBA_DIAGORIENTE_CLIENT_ID").required().asString(),
    clientSecret: env.get("LBA_DIAGORIENTE_CLIENT_SECRET").required().asString(),
    queryUrl: env.get("LBA_DIAGORIENTE_QUERY_URL").required().asString(),
    realm: env.get("LBA_DIAGORIENTE_REALM").required().asString(),
  },
  franceTravailDepotOffres: {
    login: env.get("LBA_FRANCE_TRAVAIL_DEPOT_OFFRES_LOGIN").required().asString(),
    password: env.get("LBA_FRANCE_TRAVAIL_DEPOT_OFFRES_PASSWORD").required().asString(),
    nomFlux: "LABONATA",
  },
  franceTravailIO: {
    baseUrl: "https://api.francetravail.io/partenaire",
    authUrl: "https://entreprise.francetravail.fr/connexion/oauth2/access_token",
    depotUrl: "https://portail-partenaire.francetravail.fr/partenaire/depotcurl ",
  },
  bal: {
    baseUrl: env.get("LBA_BAL_ENV_URL").required().asString(),
    apiKey: env.get("LBA_BAL_API_KEY").required().asString(),
  },
  catalogueMe: {
    username: env.get("LBA_CATALOGUE_ME_USERNAME").required().asString(),
    password: env.get("LBA_CATALOGUE_ME_PASSWORD").required().asString(),
  },
  algoRecuteursLba: {
    s3File: env.get("LBA_ALGO_RECRUTEURS_LBA_S3FILE").required().asString(),
  },
  s3: {
    accessKeyId: env.get("LBA_S3_ACCESSKEYID").required().asString(),
    secretAccessKey: env.get("LBA_S3_SECRETACCESSKEY").required().asString(),
    endpoint: env.get("LBA_S3_ENDPOINT").required().asString(),
    region: env.get("LBA_S3_REGION").required().asString(),
    bucket: {
      storage: env.get("LBA_S3_BUCKET").required().asString(),
      application: env.get("LBA_S3_APPLICATIONS_BUCKET").required().asString(),
    },
  },
  entreprise: {
    baseUrl: "https://entreprise.api.gouv.fr/v3/insee",
    context: "mission-apprentissage",
    recipient: "12000101100010", // Siret Dinum
    object: "consolidation",
    apiKey: env.get("LBA_ENTREPRISE_API_KEY").required().asString(),
    simulateError: env.get("LBA_ENTREPRISE_SIMULATE_ERROR").default("false").asBool(),
  },
  franceCompetences: {
    baseUrl: "https://api-preprod.francecompetences.fr",
    apiKey: env.get("LBA_FRANCE_COMPETENCE_API_KEY").required().asString(),
    bearerToken: env.get("LBA_FRANCE_COMPETENCE_TOKEN").required().asString(),
  },
  tco: {
    baseUrl: "https://tables-correspondances.apprentissage.beta.gouv.fr",
  },
  apiApprentissage: {
    baseUrl: "https://api.apprentissage.beta.gouv.fr/api",
    apiKey: env.get("LBA_API_APPRENTISSAGE_KEY").required().asString(),
  },
  parcoursupPeriods: {
    start: {
      startMonth: 0, // January = 0
      startDay: 2,
    },
    end: {
      endMonth: 7,
      endDay: 31,
    },
  },
  affelnetPeriods: {
    start: {
      startMonth: 2, // January = 0
      startDay: 4,
    },
    end: {
      endMonth: 7,
      endDay: 31,
    },
  },
  rhalternance: {
    apiKey: env.get("RH_ALTERNANCE_API_KEY").required().asString(),
  },
  helloworkUrl: env.get("HELLOWORK_FLUX_URL").required().asString(),
  passUrl: "https://www.pass.fonction-publique.gouv.fr/flux/offres",
  openai: {
    apiKey: env.get("OPENAI_API_KEY").required().asString(),
  },
  mistralai: {
    apiKey: env.get("MISTALAI_API_KEY").required().asString(),
  },
}

export default config
