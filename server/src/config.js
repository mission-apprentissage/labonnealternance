import env from "env-var";

const config = {
  appName: env.get("LBA_NAME").default("doctrina").asString(),
  env: env.get("LBA_ENV").default("local").asString(),
  publicUrl: env.get("LBA_PUBLIC_URL").default("http://localhost").asString(),
  publicUrlEspacePro: env.get("LBA_PUBLIC_URL_ESPACE_PRO").default("http://localhost/espace-pro").asString(),
  outputDir: env.get("LBA_OUTPUT_DIR").default(".local/output").asString(),
  formationsEndPoint: "/api/v1/entity/formations",
  maxApplicationPerDay: 100,
  elasticSearch: "http://localhost:9200",
  log: {
    level: env.get("LBA_LOG_LEVEL").default("info").asString(),
    format: env.get("LBA_LOG_FORMAT").default("pretty").asString(),
    destinations: env.get("LBA_LOG_DESTINATIONS").default("stdout").asArray(),
    type: env.get("LBA_LOG_TYPE").default("console").asString(),
  },
  slackWebhookUrl: env.get("LBA_SLACK_WEBHOOK_URL").asString(),
  mongodb: {
    uri: env
      .get("LBA_MONGODB_URI")
      .default("mongodb://127.0.0.1:27017/labonnealternance?retryWrites=true&w=majority")
      .asString(),
  },
  apiKey: env.get("LBA_API_KEY").default("12345").asString(), //TODO: check usefulness
  laBonneFormationPassword: env.get("LBA_LABONNEFORMATION_PASSWORD").default("12345").asString(),
  catalogueUrl: env.get("LBA_CATALOGUE_URL").default("https://catalogue-apprentissage.intercariforef.org").asString(),
  matcha: {
    apiKey: env.get("LBA_MATCHA_ACCESS_KEY").default("1234").asString(),
  },
  apiEntrepriseKey: env.get("LBA_ENTREPRISE_API_KEY").default("1234").asString(),
  serverSentryDsn: env
    .get("LBA_SERVER_SENTRY_DSN")
    .default("https://61156c2d46b54369b777900d475ee0f9@o154210.ingest.sentry.io/5562203")
    .asString(),
  secretUpdateRomesMetiers: env.get("LBA_SECRET_UPDATE_ROMES_METIERS").default("1234").asString(), //TODO: rename
  secret1j1s: env.get("LBA_SECRET_1J1S").default("5678").asString(), //TODO: rearrange
  secretAkto: env.get("LBA_SECRET_AKTO").default("1234").asString(), //TODO: rearrange
  jobSlackWebhook: env.get("LBA_JOB_SLACK_WEBHOOK").default("https://hooks.slack.com/services").asString(),
  allowedSources: env.get("LBA_ALLOWED_SOURCES").default("allowed").asString(),
  awsAccessKeyId: env.get("LBA_AWS_ACCESS_KEY_ID").default("1234").asString(),
  awsSecretAccessKey: env.get("LBA_AWS_SECRET_ACCESS_KEY").default("1234").asString(),
  esdClientId: env.get("LBA_ESD_CLIENT_ID").default("1234").asString(),
  esdClientSecret: env.get("LBA_ESD_CLIENT_SECRET").default("1234").asString(),
  lbb: {
    score50Level: env.get("LBA_LBB_SCORE_50").default(1).asFloatPositive(), //TODO: rename
  },
  smtp: {
    host: env.get("LBA_SMTP_HOST").default("smtp").asString(),
    port: env.get("LBA_SMTP_PORT").default("1025").asString(),
    auth: {
      user: env.get("LBA_SMTP_AUTH_USER").default("lba").asString(),
      pass: env.get("LBA_SMTP_AUTH_PASS").default("1234").asString(),
    },
    sendinblueToken: env.get("LBA_SMTP_SENDINBLUE_TOKEN").default("1234").asString(),
    sendinblueApiKey: env.get("LBA_SENDINBLUE_API_KEY").default("1234").asString(),
  },
  matchaEmail: "matcha@apprentissage.beta.gouv.fr",
  rdvEmail: "rdv_apprentissage@apprentissage.beta.gouv.fr",
  auth: {
    passwordHashRounds: env.get("LBA_AUTH_PASSWORD_HASH_ROUNDS").default(1001).asInt(),
    user: {
      jwtSecret: env.get("LBA_AUTH_USER_JWT_SECRET").default(1234).asString(),
      expiresIn: env.get("LBA_AUTH_USER_JWT_SECRET_EXPIRES").default("24h").asString(),
    },
    activation: {
      jwtSecret: env.get("LBA_AUTH_ACTIVATION_JWT_SECRET").default("456").asString(),
      expiresIn: env.get("LBA_AUTH_ACTIVATION_JWT_SECRET_EXPIRES").default("96h").asString(),
    },
    password: {
      jwtSecret: env.get("LBA_AUTH_PASSWORD_JWT_SECRET").default("789").asString(),
      expiresIn: env.get("LBA_AUTH_PASSWORD_JWT_SECRET_EXPIRES").default("1h").asString(),
    },
    magiclink: {
      jwtSecret: env.get("LBA_AUTH_MAGICLINK_JWT_SECRET").asString(),
      expiresIn: env.get("LBA_MAGICLINK_JWT_SECRET_EXPIRE").default("2h").asString(),
    },
  },
  ftp: {
    host: env.get("LBA_OPCO_FTP_HOST").default("").asString(),
    constructys: {
      user: env.get("LBA_OPCO_CONSTRUCTYS_USER").default("").asString(),
      password: env.get("LBA_OPCO_CONSTRUCTYS_PASSWORD").default("").asString(),
    },
    ocapiat: {
      user: env.get("LBA_OPCO_OCAPIAT_USER").default("").asString(),
      password: env.get("LBA_OPCO_OCAPIAT_PASSWORD").default("").asString(),
    },
  },
  akto: {
    grantType: env.get("LBA_AKTO_GRANT_TYPE").default("").asString(),
    clientId: env.get("LBA_AKTO_CLIENT_ID").default("").asString(),
    clientSecret: env.get("LBA_AKTO_CLIENT_SECRET").default("").asString(),
    scope: env.get("LBA_AKTO_SCOPE").default("").asString(),
  },
  poleEmploi: {
    clientId: env.get("LBA_POLE_EMPLOI_CLIENT_ID").default("").asString(),
    clientSecret: env.get("LBA_POLE_EMPOI_CLIENT_SECRET").default("").asString(),
  },
  lba: {
    application: env.get("LBA_APPLICATION_NAME").default("").asString(),
    apiKey: env.get("LBA_APPLICATION_ACCESS_KEY").default("").asString(),
  },
  users: {
    defaultAdmin: {
      name: env.get("LBA_USERS_DEFAULT_ADMIN_NAME").default("admin").asString(),
      password: env.get("LBA_USERS_DEFAULT_ADMIN_PASSWORD").default("password").asString(),
      role: env.get("LBA_USERS_DEFAULT_ADMIN_ROLE").default("administrator").asString(),
    },
  },
};

export default config;
