import { init } from "@socialgouv/matomo-next"
import React, { useEffect } from "react"
import HeadLaBonneAlternance from "../components/head"

import Providers from "../context/Providers"

import "../public/styles/application.css"
import "../public/styles/fonts.css"

import PageTracker from "../components/pageTracker"

import { env } from "../config/config"

export default function LaBonneAlternance({ Component, pageProps }) {
  useEffect(() => {
    init({ url: process.env.NEXT_PUBLIC_LBA_MATOMO_URL, siteId: process.env.NEXT_PUBLIC_LBA_MATOMO_SITE_ID })
  })

  return (
    <Providers env={env}>
      <PageTracker>
        <main>
          <HeadLaBonneAlternance />
          <Component {...pageProps} />
        </main>
      </PageTracker>
    </Providers>
  )
}
