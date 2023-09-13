export interface PublicConfig {
  sentry_dsn: string
  baseUrl: string
  host: string
  env: "local" | "recette" | "production" | "preview"
  matomo: {
    url: string
    siteId: string
    jsTrackerFile: string
  }
  inserJeuneApiUrl: string
}

const SENTRY_DSN = ""

function getProductionPublicConfig(): PublicConfig {
  const host = "labonnealternance.apprentissage.beta.gouv.fr"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "production",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "7",
      jsTrackerFile: "js/container_s4n03ZE1.js",
    },
    inserJeuneApiUrl: "https://exposition.inserjeunes.beta.gouv.fr",
  }
}

function getRecettePublicConfig(): PublicConfig {
  const host = "labonnealternance-recette.apprentissage.beta.gouv.fr"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "recette",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "10",
      jsTrackerFile: "js/container_6EvvnT5g.js",
    },
    inserJeuneApiUrl: "https://exposition-recette.inserjeunes.beta.gouv.fr",
  }
}

function getPreviewPublicConfig(): PublicConfig {
  const version = getVersion()
  const matches = version.match(/^0\.0\.0-(\d+)$/)

  if (!matches) {
    throw new Error(`getPreviewPublicConfig: invalid preview version ${version}`)
  }

  const host = `${matches[1]}.labonnealternance-preview.apprentissage.beta.gouv.fr`

  return {
    sentry_dsn: SENTRY_DSN,
    env: "preview",
    host,
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
    },
    inserJeuneApiUrl: "https://exposition-recette.inserjeunes.beta.gouv.fr",
  }
}

function getLocalPublicConfig(): PublicConfig {
  const host = "localhost"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "local",
    host,
    baseUrl: `http://${host}:${process.env.NEXT_PUBLIC_API_PORT}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
    },
    inserJeuneApiUrl: "https://exposition-recette.inserjeunes.beta.gouv.fr",
  }
}

function getVersion(): string {
  const version = process.env.NEXT_PUBLIC_VERSION

  if (!version) {
    throw new Error("missing NEXT_PUBLIC_VERSION env-vars")
  }

  return version
}

function getEnv(): PublicConfig["env"] {
  const env = process.env.NEXT_PUBLIC_ENV
  switch (env) {
    case "production":
    case "recette":
    case "preview":
    case "local":
      return env
    default:
      throw new Error(`Invalid NEXT_PUBLIC_ENV env-vars ${env}`)
  }
}

function getPublicConfig(): PublicConfig {
  switch (getEnv()) {
    case "production":
      return getProductionPublicConfig()
    case "recette":
      return getRecettePublicConfig()
    case "preview":
      return getPreviewPublicConfig()
    case "local":
      return getLocalPublicConfig()
  }
}

export const publicConfig: PublicConfig = getPublicConfig()
