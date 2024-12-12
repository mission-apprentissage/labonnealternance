import type { MetadataRoute } from "next"

import { publicConfig } from "../config.public"

const getRobotRules = () => {
  const { env } = publicConfig
  switch (env) {
    case "production":
      return {
        rules: {
          userAgent: "*",
          disallow: ["/test-widget", "/recherche-apprentissage-formation", "/recherche-emploi"],
        },
        sitemap: "https://labonnealternance.apprentissage.beta.gouv.fr/sitemap-index.xml",
      }

    default:
      return {
        rules: {
          userAgent: "*",
          disallow: "/",
        },
        sitemap: "",
      }
  }
}

export default function Robots(): MetadataRoute.Robots {
  return getRobotRules()
}
