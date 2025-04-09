import { useRouter } from "next/router"
import { useEffect } from "react"
import { setZodLanguage } from "shared/helpers/zodWithOpenApi"

import { setIsTrackingEnabled, setTrackingCookies } from "@/tracking/trackingCookieUtils"

import HeadLaBonneAlternance from "../components/head"
import PageTracker from "../components/pageTracker"
import Providers from "../context/Providers"

import "../public/styles/application.css"
import "../public/styles/fonts.css"
import "../public/styles/notion.css"
import "../styles/search.css"

export default function LaBonneAlternance({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    setZodLanguage("fr")
    setIsTrackingEnabled()
  }, [])
  useEffect(() => {
    setTrackingCookies(router)
  }, [router.query])

  return (
    <Providers>
      <PageTracker>
        <HeadLaBonneAlternance />
        <Component {...pageProps} />
      </PageTracker>
    </Providers>
  )
}
