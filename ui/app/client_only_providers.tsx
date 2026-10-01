"use client"

import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui"
import dynamic from "next/dynamic"
import { SnackbarProvider } from "notistack"
import type { PropsWithChildren } from "react"
import { Suspense, useEffect } from "react"

import Providers from "@/context/Providers"
import { setIsTrackingEnabled, setTrackingCookies } from "@/tracking/tracking-cookie-utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"

// hors du bundle initial : le bouton n'apparaît qu'après des interactions, rien ne presse au chargement
const FeedbackLauncher = dynamic(() => import("@/components/feedback/FeedbackLauncher").then((module) => module.FeedbackLauncher), { ssr: false })

function Tracking(): null {
  const searchParamsRecord = useSearchParamsRecord()

  useEffect(() => {
    setIsTrackingEnabled()
  }, [])
  useEffect(() => {
    setTrackingCookies(searchParamsRecord)
  }, [searchParamsRecord])

  return null
}

export default function RootTemplate({ children }: PropsWithChildren) {
  return (
    <MuiDsfrThemeProvider>
      <SnackbarProvider>
        <Suspense fallback={null}>
          <Tracking />
        </Suspense>
        <Providers>{children}</Providers>
        <FeedbackLauncher />
      </SnackbarProvider>
    </MuiDsfrThemeProvider>
  )
}
