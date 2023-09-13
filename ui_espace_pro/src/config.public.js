function getProductionPublicConfig() {
  const host = "labonnealternance.apprentissage.beta.gouv.fr"

  return {
    env: "production",
    host,
    baseUrl: `https://${host}`,
  }
}

function getRecettePublicConfig() {
  const host = "labonnealternance-recette.apprentissage.beta.gouv.fr"

  return {
    env: "recette",
    host,
    baseUrl: `https://${host}`,
  }
}

function getPreviewPublicConfig() {
  const version = getVersion()
  const matches = version.match(/^0\.0\.0-(\d+)$/)

  if (!matches) {
    throw new Error(`getPreviewPublicConfig: invalid preview version ${version}`)
  }

  const host = `${matches[1]}.labonnealternance-preview.apprentissage.beta.gouv.fr`

  return {
    env: "preview",
    host,
    baseUrl: `https://${host}`,
  }
}

function getLocalPublicConfig() {
  const host = "localhost"

  return {
    env: "local",
    host,
    baseUrl: `http://${host}:${process.env.REACT_APP_API_PORT}`,
  }
}

function getVersion() {
  const version = process.env.REACT_APP_VERSION

  if (!version) {
    throw new Error("missing NEXT_PUBLIC_VERSION env-vars")
  }

  return version
}

function getEnv() {
  const env = process.env.REACT_APP_ENV
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

function getPublicConfig() {
  switch (getEnv()) {
    case "production":
      return getProductionPublicConfig()
    case "recette":
      return getRecettePublicConfig()
    case "preview":
      return getPreviewPublicConfig()
    case "local":
      return getLocalPublicConfig()
    default:
      throw new Error("Unknown environment")
  }
}

export const publicConfig = getPublicConfig()
