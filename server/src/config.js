import env from "env-var";

const config = {
  appName: env.get("DOCTRINA_NAME").default("doctrina").asString(),
  env: env.get("DOCTRINA_ENV").default("local").asString(),
  publicUrl: env.get("DOCTRINA_PUBLIC_URL").default("http://localhost").asString(),
  outputDir: env.get("LABONNEALTERNANCE_OUTPUT_DIR").default(".local/output").asString(),
  formationsEndPoint: "/api/v1/entity/formations",
  maxApplicationPerDay: 100,
  elasticSearch: "http://localhost:9200",
  log: {
    level: env.get("DOCTRINA_LOG_LEVEL").default("info").asString(),
    format: env.get("DOCTRINA_LOG_FORMAT").default("pretty").asString(),
    destinations: env.get("DOCTRINA_LOG_DESTINATIONS").default("stdout").asArray(),
    type: env.get("LABONNEALTERNANCE_LOG_TYPE").default("console").asString(),
  },
  slackWebhookUrl: env.get("DOCTRINA_SLACK_WEBHOOK_URL").asString(),
  mongodb: {
    uri: env
      .get("DOCTRINA_MONGODB_URI")
      .default("mongodb://127.0.0.1:27017/doctrina?retryWrites=true&w=majority")
      .asString(),
  },
  private: {
    apiKey: env.get("LABONNEALTERNANCE_API_KEY").default("12345").asString(), //TODO: check usefulness
    laBonneFormationPassword: env.get("LABONNEFORMATION_PASSWORD").default("12345").asString(),
    mongodb: {
      uri: env
        .get("LABONNEALTERNANCE_MONGODB_URI")
        .default("mongodb://127.0.0.1:27017/labonnealternance?retryWrites=true&w=majority")
        .asString(),
    },
    awsAccessKeyId: env.get("AWS_ACCESS_KEY_ID").default("1234").asString(),
    awsSecretAccessKey: env.get("AWS_SECRET_ACCESS_KEY").default("1234").asString(),
    catalogueUrl: env.get("CATALOGUE_URL").default("https://catalogue-recette.intercariforef.org").asString(),
    matcha: {
      apiKey: env.get("MATCHA_ACCESS_KEY").default("1234").asString(),
    },
    apiEntrepriseKey: env.get("API_ENTREPRISE_KEY").default("1234").asString(),
    esdClientId: env.get("ESD_CLIENT_ID").default("1234").asString(),
    esdClientSecret: env.get("ESD_CLIENT_SECRET").default("1234").asString(),
    serverSentryDsn: env
      .get("SERVER_SENTRY_DSN")
      .default("https://61156c2d46b54369b777900d475ee0f9@o154210.ingest.sentry.io/5562203")
      .asString(),
    secretUpdateRomesMetiers: env.get("LABONNEALTERNANCE_SECRET_UPDATE_ROMES_METIERS").default("1234").asString(), //TODO: rename
    secret1j1s: env.get("LABONNEALTERNANCE_SECRET_1J1S").default("5678").asString(), //TODO: rearrange
    secretAkto: env.get("LABONNEALTERNANCE_SECRET_AKTO").default("1234").asString(), //TODO: rearrange
    jobSlackWebhook: env
      .get("LABONNEALTERNANCE_JOB_SLACK_WEBHOOK")
      .default("https://hooks.slack.com/services")
      .asString(),
    allowedSources: env.get("LABONNEALTERNANCE_ALLOWED_SOURCES").default("allowed").asString(),
    lbb: {
      score50Level: env.get("LABONNEALTERNANCE_LBB_SCORE_50").default(1).asFloatPositive(), //TODO: rename
    },
    smtp: {
      host: env.get("LABONNEALTERNANCE_SMTP_HOST").default("smtp").asString(),
      port: env.get("LABONNEALTERNANCE_SMTP_PORT").default("1025").asString(),
      auth: {
        user: env.get("LABONNEALTERNANCE_SMTP_AUTH_USER").default("lba").asString(),
        pass: env.get("LABONNEALTERNANCE_SMTP_AUTH_PASS").default("1234").asString(),
      },
      sendinblueToken: env.get("LABONNEALTERNANCE_SMTP_SENDINBLUE_TOKEN").default("1234").asString(),
      sendinblueApiKey: env.get("LABONNEALTERNANCE_SENDINBLUE_API_KEY").default("1234").asString(),
    },
    matchaEmail: "matcha@apprentissage.beta.gouv.fr",
    rdvEmail: "rdv_apprentissage@apprentissage.beta.gouv.fr",
  },
  auth: {
    passwordHashRounds: env.get("LABONNEALTERNANCE_AUTH_PASSWORD_HASH_ROUNDS").default(1001).asInt(),
    user: {
      jwtSecret: env.get("LABONNEALTERNANCE_AUTH_USER_JWT_SECRET").default(1234).asString(),
      expiresIn: env.get("LABONNEALTERNANCE_AUTH_USER_JWT_SECRET_EXPIRES").default("24h").asString(),
    },
    activation: {
      jwtSecret: env.get("LABONNEALTERNANCE_AUTH_ACTIVATION_JWT_SECRET").default("456").asString(),
      expiresIn: env.get("LABONNEALTERNANCE_AUTH_ACTIVATION_JWT_SECRET_EXPIRES").default("96h").asString(),
    },
    password: {
      jwtSecret: env.get("LABONNEALTERNANCE_AUTH_PASSWORD_JWT_SECRET").default("789").asString(),
      expiresIn: env.get("LABONNEALTERNANCE_AUTH_PASSWORD_JWT_SECRET_EXPIRES").default("1h").asString(),
    },
    magiclink: {
      jwtSecret: env.get("LBA_MAGICLINK_JWT_SECRET"),
      expiresIn: env.get("LBA_MAGICLINK_JWT_SECRET_EXPIRE").default("1h").asString(),
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
    apiKey: env.get("LBA_APPLICATION_API_KEY").default("").asString(),
  },
  users: {
    defaultAdmin: {
      name: env.get("LABONNEALTERNANCE_USERS_DEFAULT_ADMIN_NAME").default("admin").asString(),
      password: env.get("LABONNEALTERNANCE_USERS_DEFAULT_ADMIN_PASSWORD").default("password").asString(),
      role: env.get("LABONNEALTERNANCE_USERS_DEFAULT_ADMIN_ROLE").default("administrator").asString(),
    },
  },
};

export default config;
