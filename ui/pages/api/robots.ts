// Production only, nginx is parameter with a static page for all other environment
import { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/plain")
  res.status(200).send(
    `User-agent: *
Disallow: /test-widget
Disallow: /recherche-apprentissage
Disallow: /recherche-apprentissage-formation
Disallow: /recherche-emploi
Sitemap: https://labonnealternance.apprentissage.beta.gouv.fr/sitemap.xml`
  )
}
