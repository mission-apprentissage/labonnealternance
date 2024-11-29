// Production only, nginx is parameter with a static page for all other environment
import { NextApiRequest, NextApiResponse } from "next"

const getRobotContent = () => {
  switch (process.env.NEXT_PUBLIC_ENV) {
    case "production":
      return `User-agent: * \nDisallow: /test-widget \nDisallow: /recherche-apprentissage \nDisallow: /recherche-apprentissage-formation \nDisallow: /recherche-emploi \nSitemap: https://labonnealternance.apprentissage.beta.gouv.fr/sitemap.xml`
    default:
      return `User-agent: * \nDisallow: /`
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/plain")
  res.status(200).send(getRobotContent())
}
