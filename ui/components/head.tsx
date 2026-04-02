import React from "react"

import { publicConfig } from "@/config.public"

export const HeadLaBonneAlternance = () => {
  const { disableRobots } = publicConfig
  return (
    <>
      <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />

      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
      <meta id="robots-meta" name="robots" content={disableRobots ? "noindex, nofollow" : "index, follow"} />
      <meta name="keywords" content="contrat offres alternance emploi formation apprentissage" />
      <meta
        name="description"
        content="La bonne alternance vous aide à trouver un emploi en alternance et une formation en apprentissage. Service public gratuit, des milliers d'offres en France."
      />
      <meta name="google-site-verification" content="neOTrE-YKZ9LbgLlaX8UkYN6MJTPlWpeotPQqbrJ19Q" />
      <meta property="og:site_name" content="La bonne alternance" />
      <meta property="og:title" content="La bonne alternance - Trouvez votre alternance" />
      <meta property="og:type" content="site" />
      <meta
        property="og:description"
        content="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La bonne alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance"
      />
    </>
  )
}
