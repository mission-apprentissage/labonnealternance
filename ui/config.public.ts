export interface PublicConfig {
  sentry_dsn: string
  baseUrl: string
  host: string
  espacePro: {
    host: string
    protocol: string
  }
  env: "local" | "recette" | "production" | "preview" | "next"
  matomo: {
    url: string
    siteId: string
    jsTrackerFile: string
  }
  inserJeuneApiUrl: string
  apiEndpoint: string
}

const SENTRY_DSN = ""

function getProductionPublicConfig(): PublicConfig {
  const host = "labonnealternance.apprentissage.beta.gouv.fr"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "production",
    host,
    espacePro: {
      host,
      protocol: "https",
    },
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "7",
      jsTrackerFile: "js/container_s4n03ZE1.js",
    },
    inserJeuneApiUrl: "https://exposition.inserjeunes.beta.gouv.fr",
    apiEndpoint: `https://${host}/api`,
  }
}

function getRecettePublicConfig(): PublicConfig {
  const host = "labonnealternance-recette.apprentissage.beta.gouv.fr"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "recette",
    host,
    espacePro: {
      host,
      protocol: "https",
    },
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "10",
      jsTrackerFile: "js/container_6EvvnT5g.js",
    },
    inserJeuneApiUrl: "https://exposition-recette.inserjeunes.beta.gouv.fr",
    apiEndpoint: `https://${host}/api`,
  }
}
function getNextPublicConfig(): PublicConfig {
  const host = "labonnealternance-next.apprentissage.beta.gouv.fr"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "next",
    host,
    espacePro: {
      host,
      protocol: "https",
    },
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "10",
      jsTrackerFile: "js/container_6EvvnT5g.js",
    },
    inserJeuneApiUrl: "https://exposition-recette.inserjeunes.beta.gouv.fr",
    apiEndpoint: `https://${host}/api`,
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
    espacePro: {
      host,
      protocol: "https",
    },
    baseUrl: `https://${host}`,
    matomo: {
      url: "https://stats.beta.gouv.fr",
      siteId: "",
      jsTrackerFile: "",
    },
    inserJeuneApiUrl: "https://exposition-recette.inserjeunes.beta.gouv.fr",
    apiEndpoint: `https://${host}/api`,
  }
}

function getLocalPublicConfig(): PublicConfig {
  const host = "localhost"

  return {
    sentry_dsn: SENTRY_DSN,
    env: "local",
    host,
    espacePro: {
      host: `${host}:${process.env.NEXT_PUBLIC_ESPACE_PRO_PORT}`,
      protocol: "http",
    },
    baseUrl: `http://${host}:${process.env.NEXT_PUBLIC_API_PORT}`,
    apiEndpoint: `http://${host}:${process.env.NEXT_PUBLIC_API_PORT ?? 5000}/api`,
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
    case "next":
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
    case "next":
      return getNextPublicConfig()
  }
}

export const publicConfig: PublicConfig = getPublicConfig()
