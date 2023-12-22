import { MetadataRoute } from "next"

import { publicConfig } from "./config.public"

const getRules = () => {
  const { env } = publicConfig
  switch (env) {
    case "production":
      return {
        userAgent: "*",
        disallow: ["/recherche-apprentissage", "/recherche-apprentissage-formation", "/recherche-emploi", "/test-widget"],
      }
    case "recette":
    case "pentest":
      return {
        userAgent: "*",
        disallow: "/",
      }

    default:
      break
  }
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: getRules(),
  }
}
