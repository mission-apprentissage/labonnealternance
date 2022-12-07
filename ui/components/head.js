import React from "react"
import Head from "next/head"
import Fonts from "./fonts"

const HeadLaBonneAlternance = () => {
  return (
    <Head>
      <title>La bonne alternance | Trouvez votre alternance</title>
      <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
      <link rel="canonical" href="http://labonnealternance.pole-emploi.fr" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />

      <Fonts />

      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
      <meta id="robots-meta" name="robots" content="index, follow" />
      <meta name="keywords" content="contrat offres alternance emploi formation apprentissage" />
      <meta
        name="description"
        content="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La bonne alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance"
      />
      <meta name="google-site-verification" content="neOTrE-YKZ9LbgLlaX8UkYN6MJTPlWpeotPQqbrJ19Q" />
      <meta property="og:site_name" content="La bonne alternance" />
      <meta property="og:title" content="La bonne alternance - Trouvez votre alternance" />
      <meta property="og:type" content="site" />
      <meta property="og:url" content="https://labonnealternance.pole-emploi.fr" />
      <meta
        property="og:description"
        content="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La bonne alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance"
      />
    </Head>
  )
}

export default HeadLaBonneAlternance
