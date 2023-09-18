import { init } from "@socialgouv/matomo-next"
import React, { useEffect } from "react"

import HeadLaBonneAlternance from "../components/head"
import PageTracker from "../components/pageTracker"
import { publicConfig } from "../config.public"
import Providers from "../context/Providers"
import "../public/styles/application.css"
import "../public/styles/fonts.css"
import "../public/styles/notion.css"

export default function LaBonneAlternance({ Component, pageProps }) {
  useEffect(() => {
    init(publicConfig.matomo)
  }, [])

  return (
    <Providers env={publicConfig.env}>
      <PageTracker>
        <main>
          <HeadLaBonneAlternance />
          <Component {...pageProps} />
        </main>
      </PageTracker>
    </Providers>
  )
}
