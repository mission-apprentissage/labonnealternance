import { init } from "@socialgouv/matomo-next"
import { useEffect } from "react"

import { setIsTrackingEnabled } from "@/common/utils/matomoCookieUtils"

import HeadLaBonneAlternance from "../components/head"
import PageTracker from "../components/pageTracker"
import { publicConfig } from "../config.public"
import Providers from "../context/Providers"

import "../public/styles/application.css"
import "../public/styles/fonts.css"
import "../public/styles/notion.css"
import "../styles/search.css"

export default function LaBonneAlternance({ Component, pageProps }) {
  useEffect(() => {
    init(publicConfig.matomo)
    setIsTrackingEnabled()
  }, [])

  return (
    <Providers>
      <PageTracker>
        <HeadLaBonneAlternance />
        <Component {...pageProps} />
      </PageTracker>
    </Providers>
  )
}
