import type { MetadataRoute } from "next"

import { publicConfig } from "@/config.public"

const getRobotRules = () => {
  const { env } = publicConfig
  switch (env) {
    case "production":
      return {
        rules: {
          userAgent: "*",
          disallow: ["/test-widget", "/recherche-formation", "/recherche-emploi", "/espace-pro", "/1jeune1solution", "/1jeune1solution-recruteurs"],
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
