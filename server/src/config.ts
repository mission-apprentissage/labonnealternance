import { get } from "env-var"

const config = {
  appName: get("LBA_NAME").default("lba").asString(),
  port: get("LBA_SERVER_PORT").default(5000).asPortNumber(),
  env: get("LBA_ENV").default("local").asString(),
  publicUrl: get("LBA_PUBLIC_URL").default("http://localhost").asString(),
  publicUrlEspacePro: get("LBA_PUBLIC_URL_ESPACE_PRO").default("http://localhost/espace-pro").asString(),
  outputDir: get("LBA_OUTPUT_DIR").default(".local/output").asString(),
  formationsEndPoint: "/api/v1/entity/formations",
  maxApplicationPerDay: 100,
  elasticSearch: "http://localhost:9200",
  publicEmail: "labonnealternance@apprentissage.beta.gouv.fr",
  transactionalEmail: "nepasrepondre@apprentissage.beta.gouv.fr",
  disable_processors: get("LBA_DISABLE_PROCESSORS").default("false").asBool(),
  log: {
    level: get("LBA_LOG_LEVEL").default("info").asString(),
    format: get("LBA_LOG_FORMAT").default("pretty").asString(),
    destinations: get("LBA_LOG_DESTINATIONS").default("stdout").asArray(),
    type: get("LBA_LOG_TYPE").default("console").asString(),
  },
  slackWebhookUrl: get("LBA_SLACK_WEBHOOK_URL").asString(),
  jobSlackWebhook: get("LBA_JOB_SLACK_WEBHOOK").asString(),
  mongodb: {
    uri: get("LBA_MONGODB_URI").default("mongodb://127.0.0.1:27017/labonnealternance?retryWrites=true&w=majority").asString(),
  },
  apiKey: get("LBA_API_KEY").default("12345").asString(), //TODO: check usefulness
  laBonneFormationPassword: get("LBA_LABONNEFORMATION_PASSWORD").default("12345").asString(),
  laBonneFormationApiUrl: "https://labonneformation.pole-emploi.fr",
  catalogueUrl: get("LBA_CATALOGUE_URL").default("https://catalogue-apprentissage.intercariforef.org").asString(),
  matcha: {
    apiKey: get("LBA_MATCHA_ACCESS_KEY").default("1234").asString(),
  },
  serverSentryDsn: get("LBA_SERVER_SENTRY_DSN").default("").asString(),
  secretUpdateRomesMetiers: get("LBA_SECRET_UPDATE_ROMES_METIERS").default("1234").asString(), //TODO: rename
  secret1j1s: get("LBA_SECRET_1J1S").default("5678").asString(), //TODO: rearrange
  secretAkto: get("LBA_SECRET_AKTO").default("1234").asString(), //TODO: rearrange
  allowedSources: get("LBA_ALLOWED_SOURCES").default("allowed").asString(),
  esdClientId: get("LBA_ESD_CLIENT_ID").default("1234").asString(),
  esdClientSecret: get("LBA_ESD_CLIENT_SECRET").default("1234").asString(),
  lbb: {
    score50Level: get("LBA_LBB_SCORE_50").default(1).asFloatPositive(), //TODO: rename
  },
  smtp: {
    host: get("LBA_SMTP_HOST").default("smtp").asString(),
    port: get("LBA_SMTP_PORT").default("1025").asString(),
    auth: {
      user: get("LBA_SMTP_AUTH_USER").default("xxxxx").asString(),
      pass: get("LBA_SMTP_AUTH_PASS").default("12345").asString(),
    },
    brevoWebhookApiKey: get("LBA_BREVO_WEBHOOK_API_KEY").default("1234").asString(),
    brevoApiKey: get("LBA_BREVO_API_KEY").default("1234").asString(),
  },
  auth: {
    passwordHashRounds: get("LBA_AUTH_PASSWORD_HASH_ROUNDS").default(1001).asInt(),
    user: {
      jwtSecret: get("LBA_AUTH_USER_JWT_SECRET").default(1234).asString(),
      expiresIn: get("LBA_AUTH_USER_JWT_SECRET_EXPIRES").default("24h").asString(),
    },
    activation: {
      jwtSecret: get("LBA_AUTH_ACTIVATION_JWT_SECRET").default("456").asString(),
      expiresIn: get("LBA_AUTH_ACTIVATION_JWT_SECRET_EXPIRES").default("96h").asString(),
    },
    password: {
      jwtSecret: get("LBA_AUTH_PASSWORD_JWT_SECRET").default("789").asString(),
      expiresIn: get("LBA_AUTH_PASSWORD_JWT_SECRET_EXPIRES").default("1h").asString(),
    },
    magiclink: {
      jwtSecret: get("LBA_AUTH_MAGICLINK_JWT_SECRET").default("1234").asString(),
      expiresIn: get("LBA_MAGICLINK_JWT_SECRET_EXPIRE").default("2h").asString(),
    },
  },
  ftp: {
    host: get("LBA_FTP_HOST").default("").asString(),
    constructys: {
      user: get("LBA_FTP_CONSTRUCTYS_USER").default("").asString(),
      password: get("LBA_FTP_CONSTRUCTYS_PASSWORD").default("").asString(),
    },
    ocapiat: {
      user: get("LBA_FTP_OCAPIAT_USER").default("").asString(),
      password: get("LBA_FTP_OCAPIAT_PASSWORD").default("").asString(),
    },
  },
  akto: {
    grantType: get("LBA_AKTO_GRANT_TYPE").default("").asString(),
    clientId: get("LBA_AKTO_CLIENT_ID").default("").asString(),
    clientSecret: get("LBA_AKTO_CLIENT_SECRET").default("").asString(),
    scope: get("LBA_AKTO_SCOPE").default("").asString(),
  },
  diagoriente: {
    clientId: get("LBA_DIAGORIENTE_CLIENT_ID").default("").asString(),
    clientSecret: get("LBA_DIAGORIENTE_CLIENT_SECRET").default("").asString(),
    queryUrl: get("LBA_DIAGORIENTE_QUERY_URL").default("").asString(),
    realm: get("LBA_DIAGORIENTE_REALM").default("").asString(),
  },
  poleEmploi: {
    clientId: get("LBA_POLE_EMPLOI_CLIENT_ID").default("").asString(),
    clientSecret: get("LBA_POLE_EMPOI_CLIENT_SECRET").default("").asString(),
  },
  poleEmploiDepotOffres: {
    login: get("LBA_POLE_EMPLOI_DEPOT_OFFRES_LOGIN").default("").asString(),
    password: get("LBA_POLE_EMPLOI_DEPOT_OFFRES_PASSWORD").default("").asString(),
    nomFlux: "LABONATA",
  },
  lba: {
    application: get("LBA_APPLICATION_NAME").default("").asString(),
    apiKey: get("LBA_APPLICATION_ACCESS_KEY").default("").asString(),
  },
  bal: {
    baseUrl: get("LBA_BAL_ENV_URL").default("https://bal-recette.apprentissage.beta.gouv.fr/api/v1").asString(),
    apiKey: get("LBA_BAL_API_KEY").default("").asString(),
  },
  users: {
    defaultAdmin: {
      name: get("LBA_USERS_DEFAULT_ADMIN_NAME").default("admin").asString(),
      password: get("LBA_USERS_DEFAULT_ADMIN_PASSWORD").default("password").asString(),
      role: get("LBA_USERS_DEFAULT_ADMIN_ROLE").default("administrator").asString(),
    },
  },
  catalogueMe: {
    username: get("LBA_CATALOGUE_ME_USERNAME").default("admin").asString(),
    password: get("LBA_CATALOGUE_ME_PASSWORD").default("password").asString(),
  },
  algoBonnesBoites: {
    s3File: get("LBA_ALGO_LBB_S3FILE").default("filepath").asString(),
  },
  s3: {
    accessKeyId: get("LBA_S3_ACCESSKEYID").default("*****").asString(),
    secretAccessKey: get("LBA_S3_SECRETACCESSKEY").default("*****").asString(),
    endpoint: get("LBA_S3_ENDPOINT").default("https://").asString(),
    region: get("LBA_S3_REGION").default("ABC").asString(),
    bucket: get("LBA_S3_BUCKET").default("Bucket").asString(),
  },
  entreprise: {
    baseUrl: "https://entreprise.api.gouv.fr/v3/insee",
    context: "Matcha MNA",
    recipient: "12000101100010", // Siret Dinum
    object: "Consolidation des données",
    apiKey: get("LBA_ENTREPRISE_API_KEY").default("1234").asString(),
  },
}

export default config
