import React from "react";
import Head from "next/head";
import Fonts from "./fonts";
import env from "utils/env";

const HeadLaBonneAlternance = (props) => {
  if (typeof window !== "undefined") {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "42aea9c7-003d-4ed2-8871-130250e8c4b3";
  }

  return (
    <Head>
      <title>La Bonne Alternance | Trouvez votre alternance</title>
      <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
      <link rel="canonical" href="http://labonnealternance.pole-emploi.fr" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />

      <Fonts url={props.publicUrl} />

      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
      <meta id="robots-meta" name="robots" content="index, follow" />
      <meta name="keywords" content="contrat offres alternance" />
      <meta
        name="description"
        content="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La Bonne Alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance"
      />
      <meta property="og:site_name" content="La Bonne Alternance" />
      <meta property="og:title" content="La Bonne Alternance - Trouvez votre alternance" />
      <meta property="og:type" content="site" />
      <meta property="og:url" content="https://labonnealternance.pole-emploi.fr" />
      <meta
        property="og:description"
        content="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La Bonne Alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance"
      />

      <script
        async
        src={`https://rdv-cfa${env !== "production" ? "-recette" : ""}.apprentissage.beta.gouv.fr/assets/widget.min.js`}
      ></script>
      {env !== "local" ? (
        <script
          async
          src={`https://cdn.tagcommander.com/5234/${env !== "production" ? "uat/" : ""}tc_lba_31.js`}
        ></script>
      ) : (
        ""
      )}

      <script async src={`https://client.crisp.chat/l.js`}></script>
    </Head>
  );
};

export default HeadLaBonneAlternance;
