import { publicConfig } from "../config.public"

const getRules = () => {
  const { env } = publicConfig
  switch (env) {
    case "production":
      return "User-agent: *\r\nDisallow: /test-widget\r\nDisallow: /recherche-apprentissage\r\nDisallow: /recherche-apprentissage-formation\r\nDisallow: /recherche-emploi\r\n\r\nSitemap: https://labonnealternance.apprentissage.beta.gouv.fr/sitemap.xml"
    default:
      return "User-agent: *\r\nDisallow: /\r\n\r\nSitemap: /sitemap.xml"
  }
}

function Robots() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "text/plain")
  res.write(getRules())
  res.end()

  return {
    props: {},
  }
}

export default Robots
