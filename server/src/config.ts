import env from "env-var"

const config = {
  appName: env.get("LBA_NAME").required().asString(),
  version: env.get("PUBLIC_VERSION").required().asString(),
  port: env.get("LBA_SERVER_PORT").required().asPortNumber(),
  env: env.get("LBA_ENV").required().asEnum(["local", "recette", "production", "preview"]),
  publicUrl: env.get("LBA_PUBLIC_URL").required().asString(),
  publicUrlEspacePro: env.get("LBA_PUBLIC_URL_ESPACE_PRO").required().asString(),
  outputDir: env.get("LBA_OUTPUT_DIR").required().asString(),
  formationsEndPoint: "/api/v1/entity/formations",
  maxApplicationPerDay: 100,
  elasticSearch: "http://localhost:9200",
  publicEmail: "labonnealternance@apprentissage.beta.gouv.fr",
  transactionalEmail: "nepasrepondre@apprentissage.beta.gouv.fr",
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
  laBonneFormationPassword: env.get("LBA_LABONNEFORMATION_PASSWORD").required().asString(),
  laBonneFormationApiUrl: "https://labonneformation.pole-emploi.fr",
  catalogueUrl: env.get("LBA_CATALOGUE_URL").required().asString(),
  matcha: {
    apiKey: env.get("LBA_MATCHA_ACCESS_KEY").required().asString(),
  },
  serverSentryDsn: env.get("LBA_SERVER_SENTRY_DSN").required().asString(),
  secretUpdateRomesMetiers: env.get("LBA_SECRET_UPDATE_ROMES_METIERS").required().asString(), //TODO: rename
  secret1j1s: env.get("LBA_SECRET_1J1S").required().asString(), //TODO: rearrange
  secretAkto: env.get("LBA_SECRET_AKTO").required().asString(), //TODO: rearrange
  allowedSources: env.get("LBA_ALLOWED_SOURCES").required().asString(),
  esdClientId: env.get("LBA_ESD_CLIENT_ID").required().asString(),
  esdClientSecret: env.get("LBA_ESD_CLIENT_SECRET").required().asString(),
  lbb: {
    score50Level: env.get("LBA_LBB_SCORE_50").required().asFloatPositive(), //TODO: rename
  },
  smtp: {
    host: env.get("LBA_SMTP_HOST").required().asString(),
    port: env.get("LBA_SMTP_PORT").required().asPortNumber(),
    auth: {
      user: env.get("LBA_SMTP_AUTH_USER").required().asString(),
      pass: env.get("LBA_SMTP_AUTH_PASS").required().asString(),
    },
    brevoWebhookApiKey: env.get("LBA_BREVO_WEBHOOK_API_KEY").required().asString(),
    brevoApiKey: env.get("LBA_BREVO_API_KEY").required().asString(),
  },
  auth: {
    passwordHashRounds: env.get("LBA_AUTH_PASSWORD_HASH_ROUNDS").required().asInt(),
    user: {
      jwtSecret: env.get("LBA_AUTH_USER_JWT_SECRET").required().asString(),
      expiresIn: env.get("LBA_AUTH_USER_JWT_SECRET_EXPIRES").required().asString(),
    },
    activation: {
      jwtSecret: env.get("LBA_AUTH_ACTIVATION_JWT_SECRET").required().asString(),
      expiresIn: env.get("LBA_AUTH_ACTIVATION_JWT_SECRET_EXPIRES").required().asString(),
    },
    password: {
      jwtSecret: env.get("LBA_AUTH_PASSWORD_JWT_SECRET").required().asString(),
      expiresIn: env.get("LBA_AUTH_PASSWORD_JWT_SECRET_EXPIRES").required().asString(),
    },
    magiclink: {
      jwtSecret: env.get("LBA_AUTH_MAGICLINK_JWT_SECRET").required().asString(),
      expiresIn: env.get("LBA_MAGICLINK_JWT_SECRET_EXPIRE").required().asString(),
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
  akto: {
    grantType: env.get("LBA_AKTO_GRANT_TYPE").required().asString(),
    clientId: env.get("LBA_AKTO_CLIENT_ID").required().asString(),
    clientSecret: env.get("LBA_AKTO_CLIENT_SECRET").required().asString(),
    scope: env.get("LBA_AKTO_SCOPE").required().asString(),
  },
  diagoriente: {
    clientId: env.get("LBA_DIAGORIENTE_CLIENT_ID").required().asString(),
    clientSecret: env.get("LBA_DIAGORIENTE_CLIENT_SECRET").required().asString(),
    queryUrl: env.get("LBA_DIAGORIENTE_QUERY_URL").required().asString(),
    realm: env.get("LBA_DIAGORIENTE_REALM").required().asString(),
  },
  poleEmploi: {
    clientId: env.get("LBA_POLE_EMPLOI_CLIENT_ID").required().asString(),
    clientSecret: env.get("LBA_POLE_EMPOI_CLIENT_SECRET").required().asString(),
  },
  poleEmploiDepotOffres: {
    login: env.get("LBA_POLE_EMPLOI_DEPOT_OFFRES_LOGIN").required().asString(),
    password: env.get("LBA_POLE_EMPLOI_DEPOT_OFFRES_PASSWORD").required().asString(),
    nomFlux: "LABONATA",
  },
  lba: {
    application: env.get("LBA_APPLICATION_NAME").required().asString(),
    apiKey: env.get("LBA_APPLICATION_ACCESS_KEY").required().asString(),
  },
  bal: {
    baseUrl: env.get("LBA_BAL_ENV_URL").required().asString(),
    apiKey: env.get("LBA_BAL_API_KEY").required().asString(),
  },
  users: {
    defaultAdmin: {
      name: env.get("LBA_USERS_DEFAULT_ADMIN_NAME").required().asString(),
      password: env.get("LBA_USERS_DEFAULT_ADMIN_PASSWORD").required().asString(),
      role: env.get("LBA_USERS_DEFAULT_ADMIN_ROLE").required().asString(),
    },
  },
  catalogueMe: {
    username: env.get("LBA_CATALOGUE_ME_USERNAME").required().asString(),
    password: env.get("LBA_CATALOGUE_ME_PASSWORD").required().asString(),
  },
  algoBonnesBoites: {
    s3File: env.get("LBA_ALGO_LBB_S3FILE").required().asString(),
  },
  s3: {
    accessKeyId: env.get("LBA_S3_ACCESSKEYID").required().asString(),
    secretAccessKey: env.get("LBA_S3_SECRETACCESSKEY").required().asString(),
    endpoint: env.get("LBA_S3_ENDPOINT").required().asString(),
    region: env.get("LBA_S3_REGION").required().asString(),
    bucket: env.get("LBA_S3_BUCKET").required().asString(),
  },
  entreprise: {
    baseUrl: "https://entreprise.api.gouv.fr/v3/insee",
    context: "Matcha MNA",
    recipient: "12000101100010", // Siret Dinum
    object: "Consolidation des données",
    apiKey: env.get("LBA_ENTREPRISE_API_KEY").required().asString(),
  },
}

export default config
